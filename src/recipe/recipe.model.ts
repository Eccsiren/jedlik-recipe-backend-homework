import { Schema, model } from "mongoose";
import Recipe from "./recipe.interface";

const recipeSchema = new Schema<Recipe>(
    {
        author: {
            ref: "User",
            type: Schema.Types.ObjectId,
        },
        title: String,
        ingredients: [],
        description: String,
        category: String,
        imageURL: String,
        votes: Number,
    },
    { versionKey: false },
);

const recipeModel = model<Recipe>("Recipe", recipeSchema);

export default recipeModel;
