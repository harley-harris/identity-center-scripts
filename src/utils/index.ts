import { writeFile, readFile } from 'node:fs/promises';

export const saveToFile = async (fileName: string, data: any) => {
  try {
    await writeFile(fileName, data);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  }
};

export const saveJsonToFile = async (fileName: string, data: any) => {
  try {
    await writeFile(fileName, JSON.stringify(data));
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
  }
};

export const extractJsonFile = async (filepath: string) => {
  try {
    const data = await readFile(filepath);
    const json = JSON.parse(data.toString());
    return json;
  } catch (err) {
    console.log(err);
  }
};
