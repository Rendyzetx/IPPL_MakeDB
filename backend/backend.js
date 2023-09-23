import express from 'express';
import bodyParser from 'body-parser';
import sqlRoutes from './sqlRoutes.js';
import cors from 'cors';

const app = express();
app.use(cors());
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', sqlRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
