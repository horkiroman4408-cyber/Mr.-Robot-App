/* Konstrukcja Web Worker-ów (wspólne helpery) */
let __mrXlsxSrc=null;
function mrRobotGetCleanXlsxSource(){if(__mrXlsxSrc)return __mrXlsxSrc;const cp=new URL('js/cptable.js',document.baseURI).href,x=new URL('js/xlsx.js',document.baseURI).href;__mrXlsxSrc="importScripts('"+cp+"','"+x+"');";return __mrXlsxSrc;}
function mrRobotDisposeWorker(w){try{w.terminate();}catch(e){}if(w.__mrUrl){URL.revokeObjectURL(w.__mrUrl);w.__mrUrl=null;}}
function mrRobotMakeWorker(code){const src=mrRobotGetCleanXlsxSource()+'\n'+code;const blob=new Blob([src],{type:'application/javascript'});const url=URL.createObjectURL(blob);const w=new Worker(url);w.__mrUrl=url;return w;}
function createKpiWorker(){return mrRobotMakeWorker(KPI_WORKER_CODE);}
function createToteWorker(){return mrRobotMakeWorker(TOTE_WORKER_CODE);}
function createAudytWorker(){return mrRobotMakeWorker(AUDYT_WORKER_CODE);}
function createMdtWorker(){return mrRobotMakeWorker(MDT_WORKER_CODE);}
function createStockWorker(){return mrRobotMakeWorker(STOCK_WORKER_CODE);}
function createPrzestojeWorker(){return mrRobotMakeWorker(PRZESTOJE_WORKER_CODE);}
