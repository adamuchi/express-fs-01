import express from 'express';
import type {Request, Response} from 'express';
import bodyParser from 'body-parser';

const port = Number(process.env.PORT ?? 3000);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/ping", (req: Request, res: Response) => {
    res.json({req: req.body});
});

import {loadRoutes} from './routes';
loadRoutes('src/api').then(routes => {
    app.use('/api', routes);
    app.listen(port, () => {
        console.log(`listening on ${port}...`);
    });
});
