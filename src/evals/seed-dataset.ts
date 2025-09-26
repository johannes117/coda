import { Client } from 'langsmith';
import { DATASET_NAME, DEFAULT_EVAL_DATASET } from './agent.eval.js';
import { config } from 'dotenv';

config();

async function seed() {
  if (!process.env.LANGSMITH_API_KEY) {
    throw new Error('LANGSMITH_API_KEY environment variable is required');
  }
  const client = new Client();

  let dataset;
  try {
    dataset = await client.readDataset({ datasetName: DATASET_NAME });
    console.log(`Dataset "${DATASET_NAME}" already exists.`);
  } catch (e) {
    console.log(`Creating dataset "${DATASET_NAME}"...`);
    dataset = await client.createDataset(DATASET_NAME, {
      description: "Dataset for evaluating coda CLI agent performance",
    });
    console.log(`Dataset created.`);
  }

  const examples = [];
  try {
    for await (const example of client.listExamples({ datasetId: dataset.id })) {
      examples.push(example);
    }
  } catch {
    // No examples yet
  }


  if (examples.length === 0) {
    console.log('Seeding dataset with default examples...');
    const examplePayloads = DEFAULT_EVAL_DATASET.map(item => ({
      inputs: { question: item.input },
      outputs: { expected: item.expectedOutput },
      dataset_id: dataset.id,
    }));
    await client.createExamples(examplePayloads);
    console.log('Dataset seeded.');
  } else {
    console.log('Dataset already has examples. Skipping seeding.');
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});