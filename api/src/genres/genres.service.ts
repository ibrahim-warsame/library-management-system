import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGenreDto } from './dto/create-genre.dto.js';
import { UpdateGenreDto } from './dto/update-genre.dto.js';

const toSlug = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, '-');

@Injectable()
export class GenresService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: { books: true },
    });
    if (!genre) throw new NotFoundException(`Genre ${id} not found`);
    return genre;
  }

  async create(dto: CreateGenreDto) {
    try {
      return await this.prisma.genre.create({
        data: { name: dto.name, slug: toSlug(dto.name) },
      });
    } catch (e) {
      this.rethrow(e, dto.name);
    }
  }

  async update(id: number, dto: UpdateGenreDto) {
    await this.findOne(id);
    try {
      return await this.prisma.genre.update({
        where: { id },
        data: dto.name ? { name: dto.name, slug: toSlug(dto.name) } : {},
      });
    } catch (e) {
      this.rethrow(e, dto.name);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    try {
      return await this.prisma.genre.delete({ where: { id } });
    } catch (e) {
      // P2003 = foreign key violation: books still reference this genre.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException('Cannot delete a genre that still has books');
      }
      throw e;
    }
  }

  private rethrow(e: unknown, name?: string): never {
    // P2002 = unique constraint violation (name or slug already exists).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException(`Genre "${name}" already exists`);
    }
    throw e;
  }
}
