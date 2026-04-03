import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const indexName = process.env.PINECONE_INDEX || "second-brain";
const index = pc.index(indexName);

export interface VectorMetadata {
  userId: string;
  itemId: string;
  itemType: string;
  saveSource: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Upsert an embedding for an item to Pinecone
 */
export async function upsertEmbedding(
  itemId: string,
  vector: number[],
  metadata: VectorMetadata
) {
  try {
    await index.upsert({
      records: [
        {
          id: itemId,
          values: vector,
          metadata,
        },
      ]
    });
    return { success: true };
  } catch (error: any) {
    console.error(`[VectorDB] Error upserting embedding for item ${itemId}:`, error.message);
    throw error;
  }
}

/**
 * Query for similar embeddings in Pinecone
 */
export async function queryEmbedding(
  userId: string,
  vector: number[],
  topK: number = 20,
  filter?: any
) {
  try {
    // Always filter by userId for security/privacy
    const baseFilter = { userId: { $eq: userId } };
    const queryFilter = filter ? { ...baseFilter, ...filter } : baseFilter;

    const queryResponse = await index.query({
      vector,
      topK,
      filter: queryFilter,
      includeMetadata: true,
    });

    return queryResponse.matches;
  } catch (error: any) {
    console.error(`[VectorDB] Error querying embeddings:`, error.message);
    throw error;
  }
}

/**
 * Fetch a single vector by its ID
 */
export async function fetchEmbedding(itemId: string) {
  try {
    const response = await index.fetch({ ids: [itemId] });
    const record = response.records[itemId];
    return record?.values || null;
  } catch (error: any) {
    console.error(`[VectorDB] Error fetching embedding for item ${itemId}:`, error.message);
    throw error;
  }
}

/**
 * Delete an embedding from Pinecone
 */
export async function deleteEmbedding(itemId: string) {
  try {
    await index.deleteOne({ id: itemId });
    return { success: true };
  } catch (error: any) {
    console.error(`[VectorDB] Error deleting embedding for item ${itemId}:`, error.message);
    throw error;
  }
}
