import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.API;
const ENDPOINT = "https://api.openai.com/v1/engines/text-davinci-003/completions";
const MAX_TOKENS = 4000;

function relatedDb(permintaan) {
    if (!permintaan) {
        return false;
    }
    const keywords = ["database", "db", "tabel", "kolom", "relasi"];
    return keywords.some(keyword => permintaan.toLowerCase().includes(keyword));
}

function check_db(databaseName, sql) {
    const cleanedSql = sql.replace(/CREATE DATABASE \w+;\s*USE \w+;/gi, '');
    return `
CREATE DATABASE IF NOT EXISTS ${databaseName};
USE ${databaseName};

${cleanedSql}
    `;
}

function get_namadb(input) {
    const match = input.match(/buatkan database (\w+)/i);
    return match ? match[1] : "default_db_name";
}

async function fix_maxtoken(permintaanUser, checkRelated = true) {
    if (permintaanUser.length < MAX_TOKENS) {
        return await tanyaAI(permintaanUser, checkRelated);
    }

    const chunks = [];
    let startIndex = 0;
    while (startIndex < permintaanUser.length) {
        const chunk = permintaanUser.substr(startIndex, MAX_TOKENS);
        chunks.push(chunk);
        startIndex += MAX_TOKENS;
    }

    let combinedSql = '';
    for (const chunk of chunks) {
        const sqlPart = await tanyaAI(chunk, checkRelated);
        combinedSql += sqlPart;
    }

    const databaseName = get_namadb(permintaanUser);
    return check_db(databaseName, combinedSql);
}

async function tanyaAI(permintaanUser, checkRelated = true) {
    if (checkRelated && !relatedDb(permintaanUser)) {
        return "Error: Pertanyaan harus berkaitan dengan database.";
    }

    const promptText = `
    Dengan deskripsi: '${permintaanUser}', buatkan kode SQL yang mendefinisikan struktur database, memastikan setiap tabel saling terhubung sesuai deskripsi.

    Struktur yang diinginkan adalah sebagai berikut:

    - Setiap tabel harus memiliki tepat satu kolom sebagai kunci utama (PRIMARY KEY).
    - Kunci utama harus bertipe INTEGER, dan otomatis bertambah (AUTO_INCREMENT).
    - Semua kolom selain kunci utama harus bertipe VARCHAR(50) atau INTEGER, dan tidak boleh null.
    - Tabel-tabel harus saling terhubung melalui kunci asing (FOREIGN KEY).

    Contoh format output yang diinginkan:

    CREATE TABLE nama_tabel_1 (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      kolom_2 TIPE_DATA NOT NULL,
      ...
    );
    
    CREATE TABLE nama_tabel_2 (
      ...
      kolom_fk TIPE_DATA,
      FOREIGN KEY (kolom_fk) REFERENCES nama_tabel_1 (id),
      ...
    );

    Silahkan buatkan kode SQL sesuai dengan struktur dan format di atas.
    `;
    const data = {
        prompt: promptText,
        max_tokens: 2000,
        temperature: 0.2
    };

    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.error) {
        return `Error ${response.status}: ${JSON.stringify(responseJson)}`;
    }

    return responseJson.choices[0].text.trim();
}
function parseSqlToDiagramData(sql) {
    const diagramData = {
        tables: [],
        relations: []
    };
    const tableMatches = sql.match(/CREATE TABLE [\s\S]+?\)\;/g);
    
    if (tableMatches) {
        tableMatches.forEach(tableSql => {
            const tableNameMatch = tableSql.match(/CREATE TABLE (\w+)/);
            if (!tableNameMatch) return;
            const tableName = tableNameMatch[1];
            const columnDefinitions = tableSql.split(/,\s*FOREIGN KEY/)[0].replace(/CREATE TABLE \w+ \(/, '');
            const foreignKeyDefinitions = tableSql.split(columnDefinitions)[1];
            const columnMatches = columnDefinitions.match(/(\w+)\s+([\w()]+)( NOT NULL)?( PRIMARY KEY)?/g);
            let primaryKey = null;
            const columns = columnMatches ? columnMatches.map(col => {
                const matchResult = col.match(/(\w+)\s+([\w()]+)( NOT NULL)?( PRIMARY KEY)?/);
                if (!matchResult) return null;
                const [, colName, colType, , isPrimaryKey] = matchResult;
                if (isPrimaryKey) {
                    primaryKey = colName;
                }
                return { name: colName, type: colType };
            }).filter(column => column !== null) : [];

            diagramData.tables.push({
                name: tableName,
                columns,
                primaryKey
            });

            if (foreignKeyDefinitions) {
                const foreignKeyMatches = foreignKeyDefinitions.match(/\((\w+)\) REFERENCES (\w+) \((\w+)\)/g);
                if (foreignKeyMatches) {
                    foreignKeyMatches.forEach(fkSql => {
                        const [, fromCol, toTable, toCol] = fkSql.match(/\((\w+)\) REFERENCES (\w+) \((\w+)\)/);
                        diagramData.relations.push({
                            fromTable: tableName,
                            fromColumn: fromCol,
                            toTable,
                            toColumn: toCol
                        });
                    });
                }
            }
        });
    }
    return diagramData;
}

export {
    relatedDb,
    get_namadb,
    check_db,
    tanyaAI,
    fix_maxtoken,
    parseSqlToDiagramData
};

