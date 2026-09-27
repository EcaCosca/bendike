import type { Locale } from '@bendike/shared';
import { isLocale } from '@bendike/shared';
import { useParams } from 'react-router-dom';
import { detectLocaleFromEnvironment } from '../../../i18n/detect-locale';

/**
 * Eca's story, in the three languages the site speaks.
 *
 * This copy lives in TypeScript rather than the i18n JSON because it is
 * structured — ordered paragraphs, labelled credentials, captions tied to
 * specific photographs — and because `Record<Locale, AboutCopy>` makes the
 * compiler refuse a build where a locale is missing a paragraph. A JSON bundle
 * would silently fall back to English instead, which is how the shop ended up
 * monolingual for months without anyone noticing.
 */

export interface Credential {
  year: string;
  text: string;
}

export interface Milestone {
  since: string;
  text: string;
}

export interface CareerEntry {
  date: string;
  text: string;
}

export interface AboutCopy {
  ctaLabel: string;
  title: {
    given: string;
    nickname: string;
    family: string;
    words: string[];
    creed: string;
    place: string;
  };
  chapters: {
    air: {
      number: string;
      title: string;
      lines: string[];
      caption: string;
      readout: {
        title: string;
        labels: { altitude: string; speed: string; descent: string; glide: string };
      };
    };
    preparation: { number: string; title: string; heading: string; paragraphs: string[]; labels: string[] };
    loft: {
      number: string;
      title: string;
      heading: string;
      paragraphs: string[];
      credentials: Credential[];
      captions: [string, string];
    };
    airAndCode: {
      number: string;
      title: string;
      heading: string;
      paragraphs: string[];
      milestones: Milestone[];
      captions: [string, string];
    };
    sons: {
      number: string;
      title: string;
      heading: string;
      paragraphs: string[];
      attribution: string;
      caption: string;
    };
    colophon: { number: string; title: string; heading: string; body: string; ctaLead: string };
  };
  career: CareerEntry[];
}

const EN: AboutCopy = {
  ctaLabel: 'Create an account',
  title: {
    given: 'Enrique',
    nickname: 'Eca',
    family: 'Coscarelli',
    words: ['Rigger', 'Pilot', 'Programmer', 'Father'],
    creed: 'I spend my time rigging, programming, jumping, flying and taking care of my family.',
    place: 'Rosario, Santa Fe, Argentina',
  },
  chapters: {
    air: {
      number: '01',
      title: 'Air',
      lines: ['Locked in.', 'The flight is the part that gets filmed.'],
      caption: 'Wingsuit flight. Eca on camera.',
      readout: {
        title: 'FlySight track',
        labels: { altitude: 'Altitude', speed: 'Speed', descent: 'Descent', glide: 'Glide' },
      },
    },
    preparation: {
      number: '02',
      title: 'Preparation',
      heading: 'Luck is where opportunity meets preparation.',
      paragraphs: [
        'There is truth in that saying, but I am more scared of the contrary: being unprepared and out of luck. The planning, the drills, the pack jobs, the courses, drill after drill, and then the final execution. Done well it looks effortless, like the videos we all gaze at. In reality there is an enormous amount of effort behind it, and almost all of it goes unnoticed.',
        'Every major accident I have read about is an addition. A detail someone overlooked. A step someone skipped because they had pulled it off before, or thought they could. None of them alone is fatal. Together they leave no margin for error. Safety is the habit of not adding to that sum.',
      ],
      labels: [
        'Gear check.',
        'Pin check.',
        'Pack job.',
        'The aircraft.',
        'Winds and weather.',
        'Exit order.',
        'Canopy.',
        'Geared up.',
      ],
    },
    loft: {
      number: '03',
      title: 'The loft',
      heading: 'Welcome to my loft.',
      paragraphs: [
        'I own a rigging loft in Rosario. Reserve repacks, inspections, repairs and AAD service are the services I provide, but the cornerstone of the job is being a reliable source of information. The equipment I pack is the equipment my friends jump, so there is no version of this work I take lightly.',
        'I have been a pilot and a licensed skydiver since 2015. I hold a USPA D-licence and coach and tandem ratings since 2017, and wingsuits have been a passion since then. The parachute rigger certification from ANAC came in 2025, after a long-standing interest in safety and gear. I have always believed a rigger should be based at a dropzone to do the role well: not a qualification you carry from place to place, but a responsibility you hold as part of a community.',
      ],
      credentials: [
        { year: '2015', text: 'Private Aircraft Pilot, ANAC' },
        { year: '2015', text: 'Paracaidista, ANAC' },
        { year: '2017', text: 'Skydive D-License, USPA' },
        { year: '2017', text: 'Coach Rating, USPA' },
        { year: '2017', text: 'Tandem Instructor, USPA' },
        { year: '2017', text: 'Sigma Tandem Instructor, United Parachute Technologies' },
        { year: '2017', text: 'Wingsuit Pilot, Next Level' },
        { year: '2025', text: 'Plegador de Paracaídas, Parachute Rigger, ANAC' },
      ],
      captions: ['The loft, Rosario.', 'Reserve repack in progress.'],
    },
    airAndCode: {
      number: '04',
      title: 'Air and code',
      heading: 'We have all been there.',
      paragraphs: [
        'I have always had an interest in flight. Like many of us in this sport, for the longest time every penny I made was meant for skydiving or for flying in some shape or form: the wind tunnel, a course, gear. For a few years I measured absolutely everything in jump tickets, food included. The obsession only grew.',
        'In parallel I trained as a software engineer, building solutions to problems. It has let me travel and live in different places: a winter speedriding in Switzerland, a summer BASE jumping in Italy, a stretch based in Barcelona flying to the wingsuit tunnel one weekend and to Bovec for mountain swooping the next. I consider myself very lucky.',
        'As an engineer I take complex problems and find systems that solve them. The hardest part is understanding a business inside out: its suppliers, the history of the tools around it, how trends shift and what that does to everyone, and how a missed service bulletin can become a fatal mistake. I stand in the crossover: something I have been obsessed with for the longest time, something I do for a living, and a need I can meet with a method I believe to be sound.',
      ],
      milestones: [
        { since: '2015', text: 'Private pilot and licensed skydiver, ANAC' },
        { since: '2017', text: 'USPA D-licence, coach and tandem instructor, wingsuit pilot' },
        { since: '2025', text: 'Certified parachute rigger, ANAC' },
      ],
      captions: ['In the air.', 'At the desk.'],
    },
    sons: {
      number: '05',
      title: 'Ben and Ike',
      heading: 'Benja & Ike.',
      paragraphs: [
        'Bendike is the medium but it is also the reason for the purpose of making air sports safer, and information delivery more accessible and faster, turned into something you can act on, so everyone can grow in this sport with safety as a habit.',
        'I have two sons, Benjamin and Enrique. At home they are Benja and Ike, Bendike. I do not know what the future holds or even if they will follow my footsteps and pick up an interest in airsports.',
        'I want them to have a safer environment than the one I grew up in, and the only way I can do that is by improving the safety of the community as a whole. This is my contribution, and I hope it is something you can get behind as well.',
      ],
      attribution: 'Eca',
      caption: 'Benjamin and Enrique.',
    },
    colophon: {
      number: '06',
      title: 'Bendike',
      heading: 'Safety as a habit.',
      body: 'A rigging loft in Rosario, and the software that keeps skydivers, riggers and dropzones current on reserve repacks, AAD service and service bulletins. Information delivered faster, and turned into something you can act on.',
      ctaLead: 'Start where the gear starts.',
    },
  },
  career: [
    { date: 'Sep 2021', text: 'Lead Web Developer Instructor, SAFCSP, Saudi Arabia' },
    { date: 'Dec 2021', text: 'Lead Web Developer Instructor, WBS Coding School, Berlin' },
    { date: 'Jan 2024', text: 'Senior Software Engineer, Bayer' },
    { date: 'Dec 2024', text: 'Staff Software Engineer, John Deere' },
  ],
};

const ES: AboutCopy = {
  ctaLabel: 'Crear una cuenta',
  title: {
    given: 'Enrique',
    nickname: 'Eca',
    family: 'Coscarelli',
    words: ['Rigger', 'Piloto', 'Programador', 'Padre'],
    creed: 'Me paso el tiempo plegando, programando, saltando, volando y cuidando a mi familia.',
    place: 'Rosario, Santa Fe, Argentina',
  },
  chapters: {
    air: {
      number: '01',
      title: 'Aire',
      lines: ['Adentro.', 'El vuelo es la parte que se filma.'],
      caption: 'Vuelo en wingsuit. Eca en cámara.',
      readout: {
        title: 'Track de FlySight',
        labels: { altitude: 'Altura', speed: 'Velocidad', descent: 'Descenso', glide: 'Planeo' },
      },
    },
    preparation: {
      number: '02',
      title: 'Preparación',
      heading: 'La suerte es donde la oportunidad se cruza con la preparación.',
      paragraphs: [
        'Hay algo de verdad en esa frase, pero a mí me asusta más lo contrario: estar sin preparación y sin suerte. La planificación, los simulacros, los plegados, los cursos, repetición tras repetición, y después la ejecución final. Bien hecho parece que no costara nada, como en los videos que todos miramos. En realidad hay una cantidad enorme de trabajo atrás, y casi todo pasa desapercibido.',
        'Todo accidente grave que leí es una suma. Un detalle que alguien pasó por alto. Un paso que alguien se saltó porque ya le había salido antes, o porque creyó que le iba a salir. Ninguno solo es fatal. Juntos no dejan margen de error. La seguridad es el hábito de no sumar a esa cuenta.',
      ],
      labels: [
        'Chequeo de equipo.',
        'Chequeo de pines.',
        'Plegado.',
        'El avión.',
        'Viento y clima.',
        'Orden de salida.',
        'Campana.',
        'Equipado.',
      ],
    },
    loft: {
      number: '03',
      title: 'El taller',
      heading: 'Bienvenido a mi taller.',
      paragraphs: [
        'Tengo un taller de plegado en Rosario. Replegados de reserva, inspecciones, reparaciones y servicio de AAD son los servicios que doy, pero la base del trabajo es ser una fuente confiable de información. El equipo que pliego es el equipo con el que saltan mis amigos, así que no hay versión de este trabajo que me tome a la ligera.',
        'Soy piloto y paracaidista licenciado desde 2015. Tengo licencia D de USPA y habilitaciones de coach y tándem desde 2017, y desde entonces los wingsuits son una pasión. La certificación de plegador de paracaídas de ANAC llegó en 2025, después de un interés de años por la seguridad y el equipo. Siempre creí que un rigger tiene que estar en una dropzone para hacer bien el rol: no es un título que llevás de un lado a otro, es una responsabilidad que sostenés como parte de una comunidad.',
      ],
      credentials: [
        { year: '2015', text: 'Piloto Privado de Avión, ANAC' },
        { year: '2015', text: 'Paracaidista, ANAC' },
        { year: '2017', text: 'Licencia D de paracaidismo, USPA' },
        { year: '2017', text: 'Habilitación de Coach, USPA' },
        { year: '2017', text: 'Instructor de Tándem, USPA' },
        { year: '2017', text: 'Instructor de Tándem Sigma, United Parachute Technologies' },
        { year: '2017', text: 'Piloto de Wingsuit, Next Level' },
        { year: '2025', text: 'Plegador de Paracaídas, ANAC' },
      ],
      captions: ['El taller, Rosario.', 'Replegado de reserva en curso.'],
    },
    airAndCode: {
      number: '04',
      title: 'Aire y código',
      heading: 'Todos pasamos por ahí.',
      paragraphs: [
        'Siempre me interesó volar. Como a muchos en este deporte, durante muchísimo tiempo cada peso que ganaba iba a parar al paracaidismo o a volar de alguna forma: el túnel de viento, un curso, equipo. Durante unos años medí absolutamente todo en tickets de salto, la comida incluida. La obsesión no hizo más que crecer.',
        'En paralelo me formé como ingeniero de software, construyendo soluciones a problemas. Eso me dejó viajar y vivir en distintos lugares: un invierno haciendo speedriding en Suiza, un verano saltando BASE en Italia, una temporada con base en Barcelona volando al túnel de wingsuit un fin de semana y a Bovec a hacer swooping de montaña al siguiente. Me considero muy afortunado.',
        'Como ingeniero agarro problemas complejos y encuentro sistemas que los resuelven. Lo más difícil es entender un negocio de punta a punta: sus proveedores, la historia de las herramientas que lo rodean, cómo cambian las tendencias y qué le hace eso a todos, y cómo un boletín de servicio que se pasó por alto puede volverse un error fatal. Estoy parado en el cruce: algo que me obsesiona desde hace muchísimo, algo de lo que vivo, y una necesidad que puedo cubrir con un método que creo sólido.',
      ],
      milestones: [
        { since: '2015', text: 'Piloto privado y paracaidista licenciado, ANAC' },
        { since: '2017', text: 'Licencia D de USPA, coach, instructor de tándem y piloto de wingsuit' },
        { since: '2025', text: 'Plegador de paracaídas certificado, ANAC' },
      ],
      captions: ['En el aire.', 'En el escritorio.'],
    },
    sons: {
      number: '05',
      title: 'Ben e Ike',
      heading: 'Benja & Ike.',
      paragraphs: [
        'Bendike es el medio, pero también es el motivo: hacer los deportes aéreos más seguros, y que la información llegue más rápido y más fácil, convertida en algo sobre lo que se pueda actuar, para que todos puedan crecer en este deporte con la seguridad como hábito.',
        'Tengo dos hijos, Benjamín y Enrique. En casa son Benja e Ike, Bendike. No sé qué va a traer el futuro, ni siquiera si van a seguir mis pasos y les van a interesar los deportes aéreos.',
        'Quiero que tengan un entorno más seguro que el que me tocó a mí, y la única forma que tengo de lograrlo es mejorando la seguridad de la comunidad entera. Esta es mi contribución, y ojalá sea algo que vos también puedas apoyar.',
      ],
      attribution: 'Eca',
      caption: 'Benjamín y Enrique.',
    },
    colophon: {
      number: '06',
      title: 'Bendike',
      heading: 'La seguridad como hábito.',
      body: 'Un taller de plegado en Rosario, y el software que mantiene al día a paracaidistas, riggers y dropzones con los replegados de reserva, el servicio de AAD y los boletines de servicio. Información que llega más rápido, y convertida en algo sobre lo que podés actuar.',
      ctaLead: 'Empezá donde empieza el equipo.',
    },
  },
  career: [
    { date: 'Sep 2021', text: 'Instructor Líder de Desarrollo Web, SAFCSP, Arabia Saudita' },
    { date: 'Dic 2021', text: 'Instructor Líder de Desarrollo Web, WBS Coding School, Berlín' },
    { date: 'Ene 2024', text: 'Ingeniero de Software Senior, Bayer' },
    { date: 'Dic 2024', text: 'Staff Software Engineer, John Deere' },
  ],
};

const PT: AboutCopy = {
  ctaLabel: 'Criar uma conta',
  title: {
    given: 'Enrique',
    nickname: 'Eca',
    family: 'Coscarelli',
    words: ['Rigger', 'Piloto', 'Programador', 'Pai'],
    creed: 'Passo o tempo dobrando, programando, saltando, voando e cuidando da minha família.',
    place: 'Rosário, Santa Fé, Argentina',
  },
  chapters: {
    air: {
      number: '01',
      title: 'Ar',
      lines: ['Trancado.', 'O voo é a parte que entra no vídeo.'],
      caption: 'Voo de wingsuit. Eca na câmera.',
      readout: {
        title: 'Track do FlySight',
        labels: { altitude: 'Altitude', speed: 'Velocidade', descent: 'Descida', glide: 'Planeio' },
      },
    },
    preparation: {
      number: '02',
      title: 'Preparação',
      heading: 'A sorte é onde a oportunidade encontra a preparação.',
      paragraphs: [
        'Há verdade nessa frase, mas o que me assusta mais é o contrário: estar sem preparo e sem sorte. O planejamento, os treinos, as dobragens, os cursos, repetição atrás de repetição, e depois a execução final. Bem feito parece que não custa nada, como nos vídeos que todos ficamos olhando. Na real há uma quantidade enorme de trabalho por trás, e quase tudo passa despercebido.',
        'Todo acidente grave sobre o qual li é uma soma. Um detalhe que alguém deixou passar. Um passo que alguém pulou porque já tinha dado certo antes, ou porque achou que daria. Nenhum deles sozinho é fatal. Juntos não deixam margem de erro. Segurança é o hábito de não somar a essa conta.',
      ],
      labels: [
        'Checagem de equipamento.',
        'Checagem de pinos.',
        'Dobragem.',
        'O avião.',
        'Vento e tempo.',
        'Ordem de saída.',
        'Vela.',
        'Equipado.',
      ],
    },
    loft: {
      number: '03',
      title: 'A oficina',
      heading: 'Bem-vindo à minha oficina.',
      paragraphs: [
        'Tenho uma oficina de dobragem em Rosário. Redobras de reserva, inspeções, reparos e serviço de AAD são os serviços que ofereço, mas a base do trabalho é ser uma fonte confiável de informação. O equipamento que eu dobro é o equipamento com que os meus amigos saltam, então não existe versão deste trabalho que eu leve na esportiva.',
        'Sou piloto e paraquedista licenciado desde 2015. Tenho licença D da USPA e habilitações de coach e tandem desde 2017, e desde então os wingsuits são uma paixão. A certificação de dobrador de paraquedas da ANAC veio em 2025, depois de anos de interesse por segurança e equipamento. Sempre acreditei que um rigger precisa estar numa dropzone para fazer bem o papel: não é um título que você carrega de um lugar para outro, é uma responsabilidade que você sustenta como parte de uma comunidade.',
      ],
      credentials: [
        { year: '2015', text: 'Piloto Privado de Avião, ANAC' },
        { year: '2015', text: 'Paraquedista, ANAC' },
        { year: '2017', text: 'Licença D de paraquedismo, USPA' },
        { year: '2017', text: 'Habilitação de Coach, USPA' },
        { year: '2017', text: 'Instrutor de Tandem, USPA' },
        { year: '2017', text: 'Instrutor de Tandem Sigma, United Parachute Technologies' },
        { year: '2017', text: 'Piloto de Wingsuit, Next Level' },
        { year: '2025', text: 'Dobrador de Paraquedas, ANAC' },
      ],
      captions: ['A oficina, Rosário.', 'Redobra de reserva em andamento.'],
    },
    airAndCode: {
      number: '04',
      title: 'Ar e código',
      heading: 'Todo mundo já passou por isso.',
      paragraphs: [
        'Sempre tive interesse por voar. Como muita gente neste esporte, por muito tempo cada centavo que eu ganhava ia para o paraquedismo ou para voar de alguma forma: o túnel de vento, um curso, equipamento. Por alguns anos eu media absolutamente tudo em tickets de salto, comida incluída. A obsessão só cresceu.',
        'Em paralelo me formei engenheiro de software, construindo soluções para problemas. Isso me deixou viajar e morar em lugares diferentes: um inverno fazendo speedriding na Suíça, um verão saltando BASE na Itália, uma temporada com base em Barcelona voando para o túnel de wingsuit num fim de semana e para Bovec fazer swooping de montanha no seguinte. Me considero muito sortudo.',
        'Como engenheiro eu pego problemas complexos e encontro sistemas que os resolvem. O mais difícil é entender um negócio de ponta a ponta: seus fornecedores, a história das ferramentas ao redor, como as tendências mudam e o que isso faz com todo mundo, e como um boletim de serviço que passou despercebido pode virar um erro fatal. Estou no cruzamento: algo que me obceca há muitíssimo tempo, algo de que eu vivo, e uma necessidade que posso atender com um método que considero sólido.',
      ],
      milestones: [
        { since: '2015', text: 'Piloto privado e paraquedista licenciado, ANAC' },
        { since: '2017', text: 'Licença D da USPA, coach, instrutor de tandem e piloto de wingsuit' },
        { since: '2025', text: 'Dobrador de paraquedas certificado, ANAC' },
      ],
      captions: ['No ar.', 'Na mesa.'],
    },
    sons: {
      number: '05',
      title: 'Ben e Ike',
      heading: 'Benja & Ike.',
      paragraphs: [
        'O Bendike é o meio, mas também é o motivo: tornar os esportes aéreos mais seguros, e a informação mais rápida e mais fácil de alcançar, transformada em algo sobre o que dá para agir, para que todos possam crescer neste esporte com a segurança como hábito.',
        'Tenho dois filhos, Benjamin e Enrique. Em casa são Benja e Ike, Bendike. Não sei o que o futuro reserva, nem se eles vão seguir os meus passos e se interessar por esportes aéreos.',
        'Quero que eles tenham um ambiente mais seguro do que aquele em que eu cresci, e a única forma que tenho de fazer isso é melhorando a segurança da comunidade inteira. Esta é a minha contribuição, e tomara que seja algo que você também possa apoiar.',
      ],
      attribution: 'Eca',
      caption: 'Benjamin e Enrique.',
    },
    colophon: {
      number: '06',
      title: 'Bendike',
      heading: 'Segurança como hábito.',
      body: 'Uma oficina de dobragem em Rosário, e o software que mantém paraquedistas, riggers e dropzones em dia com as redobras de reserva, o serviço de AAD e os boletins de serviço. Informação que chega mais rápido, e transformada em algo sobre o que dá para agir.',
      ctaLead: 'Comece onde o equipamento começa.',
    },
  },
  career: [
    { date: 'Set 2021', text: 'Instrutor Líder de Desenvolvimento Web, SAFCSP, Arábia Saudita' },
    { date: 'Dez 2021', text: 'Instrutor Líder de Desenvolvimento Web, WBS Coding School, Berlim' },
    { date: 'Jan 2024', text: 'Engenheiro de Software Sênior, Bayer' },
    { date: 'Dez 2024', text: 'Staff Software Engineer, John Deere' },
  ],
};

/** Exported for tests, which assert against the English the page was written in. */
export const EN_ABOUT_COPY = EN;

const COPY: Record<Locale, AboutCopy> = { en: EN, es: ES, pt: PT };

/** The story in the reader's language. Falls back to the browser's when the route carries no locale. */
export function useAboutCopy(): AboutCopy {
  const { locale } = useParams<{ locale: string }>();
  return COPY[isLocale(locale) ? locale : detectLocaleFromEnvironment()];
}
