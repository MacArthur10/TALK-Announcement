import { Category } from './types/category';
import { PRODUCTS } from './products';

export const CATEGORIES: Category[] = [
  {
    name: 'Compost',
    slug: 'laptops',
    imageUrl:
   'https://images.pexels.com/photos/5503338/pexels-photo-5503338.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    products: PRODUCTS.filter(product => product.category.slug === 'laptops'),
  },
  {
    name: 'Decorations',
    slug: 'phones',
    imageUrl:
    'https://images.pexels.com/photos/8989497/pexels-photo-8989497.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    products: PRODUCTS.filter(product => product.category.slug === 'phones'),
  },
  {
    name: 'Textile',
    slug: 'gaming',
    imageUrl:
      'https://images.pexels.com/photos/365067/pexels-photo-365067.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    products: PRODUCTS.filter(product => product.category.slug === 'gaming'),
  },
  {
    name: 'Ustensile',
    slug: 'accessories',
    imageUrl:
      'https://media.istockphoto.com/id/476392316/photo/kitchen-utensil.jpg?s=612x612&w=is&k=20&c=kayEL2b7MMXd7zK3_vuyFPxbIwe5TWbygAouAREOmMs=',
    products: PRODUCTS.filter(
      product => product.category.slug === 'accessories'
    ),
  },
];
