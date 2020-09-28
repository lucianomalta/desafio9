import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const prdExist = await this.productsRepository.findByName(name);
    
    if (prdExist) {
      throw new AppError('This name of product exist');
    }

    const productsRepository = await this.productsRepository.create({
      name,
      price,
      quantity
    });
    return productsRepository;
  }
}

export default CreateProductService;
