import { Request, Response } from "express";
import { fileService } from "./file.service";
import { fileStorage } from "./file.storage";
import { BadRequestError } from "../../middleware/errors";

export const fileController = {
  async list(req: Request, res: Response) {
    const files = await fileService.list(req.params.projectId, req.user!.id);
    res.json(files);
  },

  async upload(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      throw new BadRequestError("No files were uploaded");
    }
    const created = await fileService.upload(
      req.params.projectId,
      req.user!.id,
      files.map((f) => ({
        tempPath: f.path,
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
      }))
    );
    res.status(201).json(created);
  },

  async download(req: Request, res: Response) {
    const { folder, fileName, originalName, mimeType } = await fileService.getDownload(
      req.params.projectId,
      req.params.fileId,
      req.user!.id
    );
    await fileStorage.sendDownload(res, folder, fileName, originalName, mimeType);
  },

  async remove(req: Request, res: Response) {
    await fileService.remove(req.params.projectId, req.params.fileId, req.user!.id);
    res.status(204).send();
  },
};
