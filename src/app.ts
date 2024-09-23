import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import indexRouter from "./routes/home.js";
import uploadRouter from "./routes/upload.js";
import * as process from "node:process";
import * as path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = 8009;

const app = express();

dotenv.config({
    path: path.resolve(__dirname, "../", ".env"),
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/", indexRouter);
app.use("/upload", uploadRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}
app.use((req, res, next) => {
    next(createError(404));
});

app.use(
    (
        err: { message: string; status: number },
        req: { app: { get: (arg0: string) => string } },
        res: {
            locals: { message: string; error: string | object };
            status: (arg0: unknown) => void;
            render: (arg0: string) => void;
        },
    ) => {
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};
        res.status(err.status || 500);
        res.render("error");
    },
);

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
