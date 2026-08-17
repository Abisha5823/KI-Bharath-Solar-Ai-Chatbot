import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for embeddings to reduce API calls
const embeddingCache = new Map();

/**
 * Generate embeddings for a text
 */
export async function getEmbedding(text, useCache = true) {
  // Check cache first
  const cacheKey = text.substring(0, 200) + text.length;
  if (useCache && embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    const embedding = response.data[0].embedding;
    
    // Store in cache (limit cache size)
    if (embeddingCache.size > 1000) {
      const firstKey = embeddingCache.keys().next().value;
      embeddingCache.delete(firstKey);
    }
    embeddingCache.set(cacheKey, embedding);
    
    return embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chunk text into smaller pieces
 */
export function chunkText(text, maxChunkSize = 1000, overlap = 100) {
  if (!text) return [];
  
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = '';
  let i = 0;
  
  while (i < sentences.length) {
    const sentence = sentences[i];
    
    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      i++;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Keep overlap
        const words = currentChunk.split(' ');
        const overlapText = words.slice(-overlap).join(' ');
        currentChunk = overlapText;
      } else {
        // Single sentence too long, split by words
        const words = sentence.split(' ');
        let partialChunk = '';
        for (const word of words) {
          if ((partialChunk + word).length <= maxChunkSize) {
            partialChunk += (partialChunk ? ' ' : '') + word;
          } else {
            if (partialChunk) chunks.push(partialChunk);
            partialChunk = word;
          }
        }
        if (partialChunk) {
          currentChunk = partialChunk;
        }
        i++;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Rank chunks by relevance to query
 */
export async function rankChunks(chunks, query, topK = 3) {
  if (!chunks || chunks.length === 0) return [];
  
  const queryEmbedding = await getEmbedding(query);
  
  const scored = await Promise.all(
    chunks.map(async (chunk) => {
      const chunkEmbedding = await getEmbedding(chunk.text || chunk);
      const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
      return {
        text: chunk.text || chunk,
        score,
        id: chunk.id
      };
    })
  );
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, topK);
}