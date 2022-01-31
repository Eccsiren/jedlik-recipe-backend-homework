import HttpException from "../exceptions/HttpException";
import RecipeNotFoundException from "../exceptions/RecipeNotFoundException";
import IdNotValidException from "../exceptions/IdNotValidException";
import { Response, Request, NextFunction, Router } from "express";
import { Types } from "mongoose";
import Controller from "../interfaces/controller.interface";
import RequestWithUser from "../interfaces/requestWithUser.interface";
import authMiddleware from "../middleware/auth.middleware";
import validationMiddleware from "../middleware/validation.middleware";
import CreateRecipeDto from "./recipe.dto";
import Recipe from "./recipe.interface";
import recipeModel from "./recipe.model";

export default class RecipeController implements Controller {
    public path = "/recipe";
    public router = Router();
    private recipe = recipeModel;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path, authMiddleware, this.getAllRecipes);
        this.router.get(`${this.path}/:id`, authMiddleware, this.getRecipeById);
        this.router.get(`${this.path}/:offset/:limit/:order/:sort/:keyword?`, authMiddleware, this.getPaginatedRecipes);
        this.router.patch(`${this.path}/:id`, [authMiddleware, validationMiddleware(CreateRecipeDto, true)], this.modifyRecipe);
        this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteRecipes);
        this.router.post(this.path, [authMiddleware, validationMiddleware(CreateRecipeDto)], this.createRecipe);
    }

    private getAllRecipes = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const count = await this.recipe.countDocuments();
            const recipes = await this.recipe.find();
            res.send({ count: count, recipes: recipes });
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private getPaginatedRecipes = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offset = parseInt(req.params.offset);
            const limit = parseInt(req.params.limit);
            const order = req.params.order;
            const sort = parseInt(req.params.sort); // desc: -1  asc: 1
            let recipes = [];
            let count = 0;
            if (req.params.keyword) {
                const regex = new RegExp(req.params.keyword, "i"); // i for case insensitive
                count = await this.recipe.find({ $or: [{ title: { $regex: regex } }, { description: { $regex: regex } }] }).count();
                recipes = await this.recipe
                    .find({ $or: [{ title: { $regex: regex } }, { description: { $regex: regex } }] })
                    .sort(`${sort == -1 ? "-" : ""}${order}`)
                    .skip(offset)
                    .limit(limit);
            } else {
                count = await this.recipe.countDocuments();
                recipes = await this.recipe
                    .find({})
                    .sort(`${sort == -1 ? "-" : ""}${order}`)
                    .skip(offset)
                    .limit(limit);
            }
            res.send({ count: count, recipes: recipes });
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private getRecipeById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (Types.ObjectId.isValid(id)) {
                const recipe = await this.recipe.findById(id).populate("author", "-password");
                if (recipe) {
                    res.send(recipe);
                } else {
                    next(new RecipeNotFoundException(id));
                }
            } else {
                next(new IdNotValidException(id));
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private modifyRecipe = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (Types.ObjectId.isValid(id)) {
                const recipeData: Recipe = req.body;
                const recipe = await this.recipe.findByIdAndUpdate(id, recipeData, { new: true });
                if (recipe) {
                    res.send(recipe);
                } else {
                    next(new RecipeNotFoundException(id));
                }
            } else {
                next(new IdNotValidException(id));
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private createRecipe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        try {
            const recipeData: Recipe = req.body;
            const createdRecipe = new this.recipe({
                ...recipeData,
                author: req.user._id,
            });
            const savedRecipe = await createdRecipe.save();
            await savedRecipe.populate("author", "-password");
            res.send(savedRecipe);
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };

    private deleteRecipes = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            if (Types.ObjectId.isValid(id)) {
                const successResponse = await this.recipe.findByIdAndDelete(id);
                if (successResponse) {
                    res.sendStatus(200);
                } else {
                    next(new RecipeNotFoundException(id));
                }
            } else {
                next(new IdNotValidException(id));
            }
        } catch (error) {
            next(new HttpException(400, error.message));
        }
    };
}
