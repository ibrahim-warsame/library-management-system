import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const genres = [
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Non-Fiction', slug: 'non-fiction' },
  { name: 'Classic Literature', slug: 'classic-literature' },
];

// genreSlug links each book to a genre created above.
const books = [
  // Science Fiction
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441013593', totalCopies: 3, genreSlug: 'science-fiction' },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', totalCopies: 2, genreSlug: 'science-fiction' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9780441478125', totalCopies: 2, genreSlug: 'science-fiction' },
  // Fantasy
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', totalCopies: 4, genreSlug: 'fantasy' },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '9780547773742', totalCopies: 2, genreSlug: 'fantasy' },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', totalCopies: 3, genreSlug: 'fantasy' },
  // Mystery
  { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', isbn: '9780140437867', totalCopies: 2, genreSlug: 'mystery' },
  { title: 'And Then There Were None', author: 'Agatha Christie', isbn: '9780062073488', totalCopies: 3, genreSlug: 'mystery' },
  { title: 'The Big Sleep', author: 'Raymond Chandler', isbn: '9780394758282', totalCopies: 1, genreSlug: 'mystery' },
  // Non-Fiction
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', totalCopies: 3, genreSlug: 'non-fiction' },
  { title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', isbn: '9781400052189', totalCopies: 2, genreSlug: 'non-fiction' },
  { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', totalCopies: 2, genreSlug: 'non-fiction' },
  // Classic Literature
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518', totalCopies: 3, genreSlug: 'classic-literature' },
  { title: 'Great Expectations', author: 'Charles Dickens', isbn: '9780141439563', totalCopies: 2, genreSlug: 'classic-literature' },
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '9780385474542', totalCopies: 2, genreSlug: 'classic-literature' },
  { title: 'Jane Eyre', author: 'Charlotte Brontë', isbn: '9780141441146', totalCopies: 2, genreSlug: 'classic-literature' },
];

const users = [
  { email: 'librarian@library.test', name: 'Lena Librarian', role: Role.LIBRARIAN },
  { email: 'patron@library.test', name: 'Paul Patron', role: Role.PATRON },
];

async function main() {
  // upsert makes the seed safe to re-run without duplicating rows.
  const genreIdBySlug = new Map<string, number>();
  for (const genre of genres) {
    const row = await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: { name: genre.name },
      create: genre,
    });
    genreIdBySlug.set(row.slug, row.id);
  }

  for (const { genreSlug, totalCopies, ...book } of books) {
    const genreId = genreIdBySlug.get(genreSlug);
    if (genreId === undefined) throw new Error(`Unknown genre slug: ${genreSlug}`);
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: { ...book, totalCopies, availableCopies: totalCopies, genreId },
    });
  }

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  const [genreCount, bookCount, userCount] = await Promise.all([
    prisma.genre.count(),
    prisma.book.count(),
    prisma.user.count(),
  ]);
  console.log(`Seeded: ${genreCount} genres, ${bookCount} books, ${userCount} users`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
