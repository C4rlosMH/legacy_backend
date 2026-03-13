import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { BlacklistModel } from './blacklist.model';
import { connectDB } from '../../config/database';

// Cargar variables de entorno
dotenv.config();

// Reemplaza este arreglo vacío con el JSON que te entregó Grok
const grokData: string[] = [
"\u0c1c\u0c4d\u0c1e\u0c3e", "\u0c1c\u0c4d\u0c1e\u0c3e\u0c28\u0c02", "\u0c1c\u0c4d\u0c1e",
"effective. power لُلُصّبُلُلصّبُررً ॣ ॣh ॣ ॣ 冗","d1scord.gift","disc0rd.gift","dliscordnltro.com","discord-app.uk",
"premiumdiscord","discordnitrofree","free nitro","discord nitro free","discord.gift","steam gift",
"st3amcommunity","free steam skins","steamcommunity.com","steam gift card","nigger","n1gger","n!gger",
"nigga","faggot","f4gg0t","f@ggot","fag","tranny","tr4nny","retard","r3t4rd","kike","k1ke","spic",
"chink","beaner","wetback","gook","maricon","m4r1c0n","marica",
"puto","p u t o","p.u.t.o","p_u_t_o","p4to","puta","p4ta","hijo de puta",
"cabron","c4bron","joder", "joer", "joputa","mierda","merda","coño", "vrg", "vrga", "v3rga", "v3rg",
"polla","p0lla","verga","pene","vagina","culo", "chupapollas","zorra","nopor",
"n0por", "nop0r", "n0 por", "no p0r", "n0 p0r", "n0p0r","porn","p0rn","porno",
"pussy","p u s s y","cock","c0ck","dick","d1ck","cunt","c u n t","asshole","4sshole","bitch","b1tch",
"whore","wh0re","slut","sl u t","fuck","f u c k","f4ck","rape","r4pe","pedo","p3do","pedophile",
"p3d0ph1le","pedofilo","pedofile","loli","l0li","shota","cp","child porn","underage sex","nude child",
"groomer","grooming","suicide","su1c1de","kys", "kill yourself", "k1ll y0urs3lf", "kill urself",
"hang yourself", "h4ng y0urs3lf", "cut yourself", "self harm", "selfharm", "autolesion", "suicidate",
"su1c1d4te", "matate", "m4t4te", "muerete", "go kill yourself", "me quiero matar", "me voy a suicidar",
"s u i c i d e", "k y s", "h a n g   y o u r s e l f", "c u t   y o u r s e l f", "acoso sexual", "violacion"
];

const seedBlacklist = async () => {
  try {
    // 1. Usamos tu función oficial para conectar, la cual ya sabe leer tu .env correctamente
    await connectDB();
    console.log('[Sistema] Iniciando inyección de Blacklist...');

    let insertedCount = 0;

    for (const term of grokData) {
      try {
        await BlacklistModel.updateOne(
          { term: term.toLowerCase() },
          { 
            $set: { 
              term: term.toLowerCase(),
              category: 'text_bomb', 
              isActive: true 
            } 
          },
          { upsert: true }
        );
        insertedCount++;
      } catch (err) {
        console.error(`Error al insertar el término: ${term}`, err);
      }
    }

    console.log(`[Éxito] Se inyectaron/actualizaron ${insertedCount} términos maliciosos en la base de datos.`);
    
    // Desconectamos limpiamente para que la terminal no se quede colgada
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('[Error Crítico] Fallo en la inyección:', error);
    process.exit(1);
  }
};

seedBlacklist();