from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from services import process_and_index_pdfs, query_assistant

load_dotenv()

app = FastAPI(title="Multi-Document Research Assistant API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Check if API keys are set
    if not os.environ.get("PINECONE_API_KEY") or not os.environ.get("COHERE_API_KEY"):
        raise HTTPException(status_code=500, detail="Missing API keys in backend configuration")
        
    try:
        chunks_indexed = await process_and_index_pdfs(files)
        return {"message": f"Successfully processed and indexed {chunks_indexed} chunks from {len(files)} files."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_documents(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Empty query provided")
        
    # Check if API keys are set
    if not os.environ.get("PINECONE_API_KEY") or not os.environ.get("COHERE_API_KEY"):
        raise HTTPException(status_code=500, detail="Missing API keys in backend configuration")
        
    try:
        response = query_assistant(request.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
