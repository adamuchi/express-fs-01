import {Request, Response, NextFunction, Router} from 'express';
import * as fs from 'fs';
import * as path from 'path';

export interface LoadRoutesOptions {
    directory: string;
    ignore: RegExp;
    include: RegExp;
}

async function findAllRoutes(rootDir: string) {
    const ignorePattern = /_/;
    const includePattern = /\.(js|ts)$/;
    const routes = new Map();
    const recurse = async (directory: string) => {
        const files = fs.readdirSync(directory, {withFileTypes: true});
        for(const file of files) {
            if(ignorePattern.test(file.name)) {
                continue;
            }
            const filePath = path.join(directory, file.name);
            if(file.isDirectory()) {
                recurse(filePath);
                continue;
            }
            if(!file.isFile()) {
                console.log(`Unsupported directory entry ${filePath}, ignoring..`);
                continue;
            }
            if(!includePattern.test(file.name)) {
                console.log(`Unsupported file type ${filePath}, ignoring..`);
                continue;
            }
            const mod = await import(filePath);
            const key = filePath.slice(directory.length).replace(includePattern, '');
            routes.set(key, mod?.default);
        }
    };
    await recurse(rootDir);
    return routes;
}

enum Method {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
    PATCH = 'patch',
    OPTIONS = 'options',
    ALL = 'all',
}

function install(router: Router, method: Method, path: string, config: any) {
    console.log(`Installing ${method.toUpperCase()} ${path} with ${config}`);
    router[method](path, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const response = await config.handler(req.body);
            res.json(response);
        }
        catch(error) {
            next(error);
        }
    });
}

export async function loadRoutes(rootDir = 'api') {
    const routes = await findAllRoutes(path.resolve(rootDir));
    const router = Router();

    for(const [path, config] of routes.entries()) {
        for(const method of Object.values(Method)) {
            if(method in config) {
                install(router, method, path, config[method]);
            }
        }
    }

    return router;
}
