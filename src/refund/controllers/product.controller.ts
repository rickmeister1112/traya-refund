import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities';

@Controller('products')
export class ProductController {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() createProductDto: any) {

    const existingProduct = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product already present with SKU: ${createProductDto.sku}`,
      );
    }

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  @Get()
  async getAllProducts() {
    return await this.productRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  @Get('kit-products')
  async getKitProducts() {
    return await this.productRepository.find({
      where: { isKitProduct: true, isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  @Get('category/:category')
  async getProductsByCategory(@Param('category') category: string) {
    return await this.productRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return await this.productRepository.findOne({ where: { id } });
  }

  @Get('sku/:sku')
  async getProductBySKU(@Param('sku') sku: string) {
    return await this.productRepository.findOne({ where: { sku } });
  }

  @Patch(':id')
  async updateProduct(@Param('id') id: string, @Body() updateData: any) {
    await this.productRepository.update(id, updateData);
    return await this.productRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {

    await this.productRepository.softDelete(id);
    await this.productRepository.update(id, { isActive: false });
    return { message: 'Product soft-deleted successfully (can be restored)' };
  }

  @Post(':id/restore')
  async restoreProduct(@Param('id') id: string) {
    await this.productRepository.restore(id);
    await this.productRepository.update(id, { isActive: true });
    return { message: 'Product restored successfully' };
  }
}

