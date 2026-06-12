import bcrypt from 'bcryptjs';

const hash = '$2a$10$HK3KifK8u/OKPcZpwgk4F.CPzomkoDmSlKefgODWI0IrUl8PA986S';
const passwords = ['bimt@123', 'bimt123', 'Bimt@123', 'admin123', 'admin@123', 'vishal@123', 'Vishal@123', '123456'];

async function main() {
  for (const pwd of passwords) {
    const match = await bcrypt.compare(pwd, hash);
    console.log(`${pwd.padEnd(20)} -> ${match ? 'MATCH' : 'no'}`);
    if (match) break;
  }
}

main();
