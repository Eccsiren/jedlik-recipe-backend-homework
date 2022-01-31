import { Types } from "mongoose";
export default interface Recipe {
    _id: Types.ObjectId | string;
    author: Types.ObjectId | string;
    title: string;
    ingredients: string[];
    description: string;
    category: string;
    imageURL: string;
    votes: number;
}
