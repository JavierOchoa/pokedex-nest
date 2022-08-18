import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  
  constructor(@InjectModel(Pokemon.name) private readonly pokemonModel: Model<Pokemon>){}
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try{
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error){
      this.handleExceptions(error); 
    }
  }

  findAll(paginationDto: PaginationDto) {
    const {limit=10, offset=0} = paginationDto
    return this.pokemonModel.find().limit(limit).skip(offset).sort({no:1}).select('-__v');
  }

  async findOne(term: string) {
     let pokemon: Pokemon;

     if(!isNaN(+term)){
      pokemon = await this.pokemonModel.findOne( { no: term } ) 
    }

    if(!pokemon && isValidObjectId(term)){
      pokemon = await this.pokemonModel.findById(term);
    }

    if(!pokemon){
      pokemon = await this.pokemonModel.findOne({name: term.toLocaleLowerCase()})
    }

     if(!pokemon) throw new NotFoundException(`Pokemon with id, name or no "${term}" not found`)
     return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term)
    if(updatePokemonDto.name){
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
      try{
        await pokemon.updateOne(updatePokemonDto, {new: true})
        return {...pokemon.toJSON(), ...updatePokemonDto};
      } catch(error){
        this.handleExceptions(error);
      }
    } 
  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id);
    // await pokemon.deleteOne();
    // const result = await this.pokemonModel.findByIdAndDelete(id);
    const {deletedCount} = await this.pokemonModel.deleteOne({_id:id});
    if(deletedCount===0){
      throw new BadRequestException(`Pokemon with id "${id}" not found`)
    }
    return; 
  }
  private handleExceptions(error: any){
    if(error.code === 11000){
      throw new BadRequestException(`Pokemon exist in db ${JSON.stringify(error.keyValue)}`);
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't create Pokemon - Check server console`)
  }
}
