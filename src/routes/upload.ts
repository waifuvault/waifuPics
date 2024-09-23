import express, { Response as ExpressResponse } from "express";
import { upload } from "../multerConfig.js";
import { fileTypeFromBuffer } from "file-type";
import mime from "mime";
import { CommonError, CommonResult, WaifuError, WaifuResponse } from "../typings.js";
import * as process from "node:process";

const router = express.Router();

const waifuVaultBaseUrl = process.env.WAIFU_VAULT_BASE_URL;
const bucket = process.env.BUCKET;

router.put("/", upload.single("file"), async (req, res) => {
    const file = req?.file;
    if (!file) {
        return sendErr(res, {
            status: 400,
            message: "No file uploaded",
        });
    }
    const fileBuffer = req?.file?.buffer;
    if (!fileBuffer) {
        return sendErr(res, {
            status: 400,
            message: "No file uploaded",
        });
    }

    try {
        const isImageFile = await isImage(fileBuffer, file.originalname);
        if (!isImageFile) {
            return sendErr(res, {
                status: 400,
                message: "Only images allowed",
            });
        }
    } catch (e) {
        return sendErr(res, {
            status: 500,
            message: e.message,
        });
    }

    let fileUrl = "";
    try {
        fileUrl = await uploadImage(fileBuffer, file.originalname);
    } catch (e) {
        return sendErr(res, e as CommonError);
    }

    return res
        .status(201)
        .location(fileUrl)
        .send({
            message: fileUrl,
        } as CommonResult);
});

async function uploadImage(buffer: Buffer, fileName: string): Promise<string> {
    const body = new FormData();
    const blob = new Blob([buffer]);
    body.append("file", blob, fileName);
    const response = await fetch(`${waifuVaultBaseUrl}/rest/${bucket}`, {
        method: "PUT",
        body,
    });
    const err = await checkError(response);
    if (err) {
        throw err;
    }

    const json: WaifuResponse = await response.json();
    return json.url;
}

async function checkError(response: Response): Promise<CommonError | null> {
    if (!response.ok) {
        const err = await response.text();
        let errStr;
        try {
            const respErrorJson: WaifuError = JSON.parse(err);
            errStr = `Error ${respErrorJson.status} (${respErrorJson.name}): ${respErrorJson.message}`;
        } catch {
            errStr = err;
        }
        return {
            message: errStr,
            status: response.status,
        };
    }

    return null;
}

async function isImage(buff: Buffer, resourceName: string): Promise<boolean> {
    // the order is very important, do not change

    // first check the buffer magic bytes
    const mimeFromBuffer = await fileTypeFromBuffer(buff);
    if (mimeFromBuffer) {
        return checkMime(mimeFromBuffer.mime);
    }

    // then check the extension
    if (resourceName) {
        const extType = mime.getType(resourceName);
        if (extType) {
            return checkMime(extType);
        }
    }

    return false;
}

function sendErr(res: ExpressResponse, err: CommonError): ExpressResponse {
    return res.status(err.status).send(err);
}

function checkMime(mimeType: string): boolean {
    return mimeType.startsWith("image/");
}

export default router;
