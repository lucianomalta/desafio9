import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExist = await this.customersRepository.findById(customer_id);

    if (!customerExist) {
      throw new AppError('Customer does not exist');
    }

    const prdsExist = await this.productsRepository.findAllById(products);

    // existentProducts
    if (!prdsExist.length) {
      throw new AppError('Products does not exist');
    }

    const listIdProducts = prdsExist.map(product => product.id);

    const chkIdProducts = products.filter(
      product => !listIdProducts.includes(product.id)
    );
    
    // checkInexistentProducts
    if (chkIdProducts.length) {
      throw new AppError(`Could not find product ${chkIdProducts[0].id}`);
    };
    
    const prdQuantityAvailable = products.filter(
      product => prdsExist.filter(p => p.id === product.id)[0].quantity < product.quantity
    )

    if (prdQuantityAvailable.length) {
      throw new AppError(`The quantity ${prdQuantityAvailable[0].quantity} is not avalilable for product ${prdQuantityAvailable[0].id}`);
    }

    const objProducts = products.map( product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: prdsExist.filter( p => p.id === product.id)[0].price
    }));

    const order = await this.ordersRepository.create({
      customer: customerExist,
      products: objProducts
    });

    const { order_products } = order;

    const orderProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity: prdsExist.filter( p => p.id === product.product_id)[0].quantity - product.quantity,
    }))

    await this.productsRepository.updateQuantity(orderProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
