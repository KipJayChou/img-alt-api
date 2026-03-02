import { load } from 'https://deno.land/std/dotenv/mod.ts';
import { encodeBase64 } from 'https://deno.land/std/encoding/base64.ts';
import { Hono } from 'https://deno.land/x/hono/mod.ts';
import { cors } from 'https://deno.land/x/hono/middleware.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const env = await load();

const PROMPT = `Please provide a detailed description of this image for social media alt-text. 
Return the description in both English and Chinese. 
Format the response strictly as:
English: [Detailed description in English]
Chinese: [详细的中文描述]
Do not use the first person or phrases like "This image shows".`;
const MAX_TOKENS = 1000;
const UPLOAD_LIMIT = Deno.env.get('UPLOAD_LIMIT') || env.UPLOAD_LIMIT || 10 * 1024 * 1024;
const API_KEY = Deno.env.get('GEMINI_API_KEY') || env.GEMINI_API_KEY;
const MODEL = Deno.env.get('GEMINI_MODEL') || env.GEMINI_MODEL || 'gemini-1.5-flash';

const genAI = new GoogleGenerativeAI(API_KEY);

// 辅助函数：将图片转换为 Gemini 所需的格式
async function getImagePart(imageUrlOrData) {
  if (imageUrlOrData.startsWith('data:')) {
    const [header, base64Data] = imageUrlOrData.split(',');
    const mimeType = header.match(/:(.*?);/)[1];
    return { inlineData: { data: base64Data, mimeType } };
  } else {
    const response = await fetch(imageUrlOrData);
    const buffer = await response.arrayBuffer();
    return {
      inlineData: {
        data: encodeBase64(buffer),
        mimeType: response.headers.get('content-type') || 'image/jpeg'
      }
    };
  }
}

async function requestVision(image_url, { lang } = {}) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const imagePart = await getImagePart(image_url);
  
  let finalPrompt = PROMPT;
  // 如果请求中带了 lang 参数（如 ?lang=ja），则优先遵循参数
  if (lang) {
    finalPrompt = `Detailedly describe this image in this language: "${lang}". Do not use the first person.`;
  }

  const result = await model.generateContent([finalPrompt, imagePart], {
    generationConfig: {
      maxOutputTokens: MAX_TOKENS, // 确保使用我们定义的 1000 tokens
      temperature: 0.7,            // 稍微增加随机性让描述更生动
    }
  });
  
  const response = await result.response;
  let text = response.text();
  return text.trim();
}

const app = new Hono();
app.use('*', cors({ allowMethods: ['GET', 'POST'] }));

app.get('/', async (c) => {
  const image = c.req.query('image');
  const lang = c.req.query('lang');
  
  if (/https?:\/\//.test(image)) {
    try {
      const description = await requestVision(image, { lang });
      return c.json({ description });
    } catch (error) {
      return c.json({ error: error.message }, 500);
    }
  }
  return c.json({ name: 'img-alt-api-gemini', model: MODEL });
});

app.post('/', async (c) => {
  const lang = c.req.query('lang');
  const { image } = await c.req.parseBody();

  if (!image || !/^image\//.test(image.type)) {
    return c.json({ error: 'Invalid image' }, 400);
  }

  try {
    const arrayBuffer = await image.arrayBuffer();
    const base64Image = encodeBase64(arrayBuffer);
    const description = await requestVision(`data:${image.type};base64,${base64Image}`, { lang });
    return c.json({ description });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
