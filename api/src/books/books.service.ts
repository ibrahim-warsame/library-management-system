import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(genreId?: string, search?: string, page?: string, limit?: string) {
    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (pageNum - 1) * take;

    const where: Prisma.BookWhereInput = {
      ...(genreId && { genreId: Number(genreId) }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: { genre: true },
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) },
    };
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { genre: true },
    });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    return book;
  }

  async create(dto: CreateBookDto) {
    await this.assertGenreExists(dto.genreId);
    try {
      return await this.prisma.book.create({
        data: {
          ...dto,
          description: dto.description ?? '',
          availableCopies: dto.totalCopies,
        },
        include: { genre: true },
      });
    } catch (e) {
      this.rethrow(e, dto.isbn);
    }
  }

  async update(id: number, dto: UpdateBookDto) {
    const book = await this.findOne(id);
    if (dto.genreId !== undefined) await this.assertGenreExists(dto.genreId);

    const data: Prisma.BookUncheckedUpdateInput = { ...dto };
    if (dto.totalCopies !== undefined) {
      // Keep the number of checked-out copies the same when the total changes.
      const checkedOut = book.totalCopies - book.availableCopies;
      if (dto.totalCopies < checkedOut) {
        throw new BadRequestException(
          `totalCopies cannot be less than the ${checkedOut} copies currently checked out`,
        );
      }
      data.availableCopies = dto.totalCopies - checkedOut;
    }

    try {
      return await this.prisma.book.update({
        where: { id },
        data,
        include: { genre: true },
      });
    } catch (e) {
      this.rethrow(e, dto.isbn);
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.book.delete({ where: { id } });
  }

  private async assertGenreExists(genreId: number) {
    const genre = await this.prisma.genre.findUnique({ where: { id: genreId } });
    if (!genre) throw new BadRequestException(`Genre ${genreId} does not exist`);
  }

  private rethrow(e: unknown, isbn?: string): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException(`A book with ISBN ${isbn} already exists`);
    }
    throw e;
  }
}
