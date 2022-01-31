import { IsArray, IsNumber, IsString } from "class-validator";

export default class CreateRecipeDto {
    @IsString()
    public title: string;

    @IsArray()
    public ingredients: string[];

    @IsString()
    public description: string;

    @IsString()
    public category: string;

    @IsString()
    public imageURL: string;

    @IsNumber()
    public votes: number;
}
