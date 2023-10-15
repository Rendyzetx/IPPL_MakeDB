import fetch from 'node-fetch';


const API_KEY = "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";
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

    const promptText = `Dengan deskripsi: '${permintaanUser}', buatkan kode SQL yang mendefinisikan struktur database, memastikan setiap tabel saling terhubung sesuai deskripsi.`;
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
            const columnMatches = tableSql.match(/(\w+)\s+([\w()]+)( NOT NULL)?( PRIMARY KEY)?/g);
            let primaryKey = null;
            const columns = columnMatches ? columnMatches.map(col => {
                const [, colName, colType, , isPrimaryKey] = col.match(/(\w+)\s+([\w()]+)( NOT NULL)?( PRIMARY KEY)?/);
                if (isPrimaryKey) {
                    primaryKey = colName;
                }
                return { name: colName, type: colType };
            }) : [];

            diagramData.tables.push({
                name: tableName,
                columns,
                primaryKey
            });

            const foreignKeyMatches = tableSql.match(/FOREIGN KEY \((\w+)\) REFERENCES (\w+) \((\w+)\)/g);
            if (foreignKeyMatches) {
                foreignKeyMatches.forEach(fkSql => {
                    const [, fromCol, toTable, toCol] = fkSql.match(/FOREIGN KEY \((\w+)\) REFERENCES (\w+) \((\w+)\)/);
                    diagramData.relations.push({
                        fromTable: tableName,
                        fromColumn: fromCol,
                        toTable,
                        toColumn: toCol
                    });
                });
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

