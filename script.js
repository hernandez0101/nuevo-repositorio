let pdfDoc = null;
let totalPages = 0;
let currentPages = []; // Para almacenar las páginas del PDF en el orden original
const container = document.getElementById('pdf-container');
const uploadInput = document.getElementById('pdf-upload');
const downloadButton = document.getElementById('download');

// Función para cargar el archivo PDF
uploadInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
      const arrayBuffer = e.target.result;
      loadPDF(arrayBuffer);
    };
    fileReader.readAsArrayBuffer(file);
  } else {
    alert('Por favor, selecciona un archivo PDF.');
  }
});

// Función para cargar el PDF con PDF.js
function loadPDF(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument(arrayBuffer);
  
  loadingTask.promise.then(pdf => {
    pdfDoc = pdf;
    totalPages = pdf.numPages;
    currentPages = []; // Resetear el orden
    renderPages(); // Mostrar las miniaturas de las páginas
    downloadButton.disabled = false; // Habilitar el botón de descarga
  }).catch(error => {
    console.error('Error al cargar el PDF:', error);
  });
}

// Función para renderizar todas las páginas como miniaturas
function renderPages() {
  container.innerHTML = ''; // Limpiar el contenedor de miniaturas
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    pdfDoc.getPage(pageNum).then(page => {
      const scale = 0.2; // Tamaño de la miniatura
      const viewport = page.getViewport({ scale: scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.classList.add('canvas-container');
      canvas.setAttribute('data-page', pageNum); // Añadir el número de la página como atributo

      // Renderizar la página en el canvas
      page.render({
        canvasContext: context,
        viewport: viewport
      });

      // Agregar un listener para ordenar las páginas al hacer clic
      canvas.addEventListener('click', () => reorderPages(pageNum));

      container.appendChild(canvas);
      currentPages.push(pageNum); // Almacenar el número de página en el orden
    });
  }
}

// Función para reordenar las páginas
function reorderPages(pageNum) {
  const index = currentPages.indexOf(pageNum);
  if (index === -1) return;

  // Mover la página seleccionada hacia la última posición
  currentPages.push(currentPages.splice(index, 1)[0]);
  renderPages(); // Volver a renderizar las páginas en el nuevo orden
}

// Función para descargar el PDF reordenado
downloadButton.addEventListener('click', async () => {
  const pdfDocCopy = await PDFLib.PDFDocument.create();
  
  // Añadir las páginas en el nuevo orden
  for (const pageNum of currentPages) {
    const [copiedPage] = await pdfDocCopy.copyPages(pdfDoc, [pageNum - 1]); // PDF-lib usa 0-index
    pdfDocCopy.addPage(copiedPage);
  }

  // Guardar el PDF generado
  const pdfBytes = await pdfDocCopy.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  // Crear un enlace de descarga y hacer clic en él automáticamente
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pdf_reordenado.pdf';
  a.click();
});
