import os
import tempfile
from typing import List, Dict, Any

from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_cohere import CohereEmbeddings, ChatCohere, CohereRerank
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from pinecone import Pinecone, ServerlessSpec

def init_pinecone_index():
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
    index_name = os.environ.get("PINECONE_INDEX_NAME", "research-assistant-cohere")
    
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=1024, 
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    return index_name

async def process_and_index_pdfs(files: List[UploadFile]) -> int:
    index_name = init_pinecone_index()
    embeddings = CohereEmbeddings(model="embed-english-v3.0")
    vectorstore = PineconeVectorStore(index_name=index_name, embedding=embeddings)
    
    all_chunks = []
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

    for file in files:
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            loader = PyPDFLoader(tmp_path)
            docs = loader.load()
            
            
            for doc in docs:
                doc.metadata["document_name"] = file.filename
               
                if "page" not in doc.metadata:
                    doc.metadata["page"] = 1
                else:
                    doc.metadata["page"] = doc.metadata["page"] + 1 # 1-indexed

            chunks = text_splitter.split_documents(docs)
            all_chunks.extend(chunks)
        finally:
            os.unlink(tmp_path)

    if all_chunks:
        
        vectorstore.add_documents(all_chunks)

    return len(all_chunks)

def query_assistant(query: str) -> Dict[str, Any]:
    index_name = init_pinecone_index()
    embeddings = CohereEmbeddings(model="embed-english-v3.0")
    vectorstore = PineconeVectorStore(index_name=index_name, embedding=embeddings)
    
    
    base_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
    retrieved_docs = base_retriever.invoke(query)
    
    
    compressor = CohereRerank(model="rerank-english-v3.0", top_n=4)
    reranked_docs = compressor.compress_documents(retrieved_docs, query)
    
   
    context_parts = []
    citations = []
    for i, doc in enumerate(reranked_docs):
        doc_name = doc.metadata.get("document_name", "Unknown Document")
        page_num = doc.metadata.get("page", "?")
        context_parts.append(f"[Citation {i+1}] Source: {doc_name}, Page: {page_num}\n{doc.page_content}")
        citations.append({"document_name": doc_name, "page": page_num, "snippet": doc.page_content[:200] + "..."})
        
    formatted_context = "\n\n".join(context_parts)

    llm = ChatCohere(model="command-r", temperature=0)
    
    prompt = PromptTemplate.from_template(
        "You are an expert research assistant. Answer the user's question based ONLY on the provided context.\n"
        "If you use information from the context, you MUST cite it using the format [Citation X].\n"
        "If the answer cannot be found in the context, say 'I cannot find the answer in the provided documents.'\n\n"
        "Context:\n{context}\n\n"
        "Question: {question}\n\n"
        "Answer:"
    )
    
    chain = prompt | llm | StrOutputParser()
    
    answer = chain.invoke({"context": formatted_context, "question": query})
    
    return {
        "answer": answer,
        "citations": citations
    }
