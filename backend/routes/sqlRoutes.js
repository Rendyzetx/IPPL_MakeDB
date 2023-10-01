import express from 'express';
import { relatedDb, get_namadb, check_db, fix_maxtoken } from '../utils/utils.js';
import { logActivity } from '../utils/db.js';

const router = express.Router();

router.post('/generateSQL', async (req, res) => {
    const permintaanUser = req.body.permintaanUser;
    if (!relatedDb(permintaanUser)) {
        return res.json({
            error: "Pertanyaan harus berkaitan dengan database."
        });
    }
    const result = await fix_maxtoken(permintaanUser);
    const databaseName = get_namadb(permintaanUser);
    const finalResult = check_db(databaseName, result);
    res.app.locals.sqlResult = finalResult;
    res.json({ sql: finalResult });
});

router.post('/modifySQLWithMaxTokens', async (req, res) => {
    const initialSql = req.body.initialSql;
    const additionalInput = req.body.additionalInput;
    const combinedInput = initialSql + ' ' + additionalInput;
    const modifiedSql = await fix_maxtoken(combinedInput, false);
    res.app.locals.sqlResult = modifiedSql;
    res.json({ sql: modifiedSql });
});

router.get('/getSQLResult',(req, res) => {
    const sqlResult = res.app.locals.sqlResult || "Tidak Ada SQL yang Dihasilkan";
    
    res.json({ sql: sqlResult });
});

export default router;

