// Simple PSPDFKit test component
import React, { useEffect, useRef, useState } from "react";

const PDFTest = () => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAndTest = async () => {
      try {
        // Load PSPDFKit script
        if (!window.PSPDFKit) {
          const script = document.createElement('script');
          script.src = '/nutrient-sdk/nutrient-viewer.js';
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        console.log("PSPDFKit loaded:", !!window.PSPDFKit);
        
        if (!window.PSPDFKit) {
          throw new Error("PSPDFKit failed to load");
        }

        // Test with a simple PDF URL
        const pdfUrl = "http://localhost:5000/uploads/1/1750649312707-266010329.pdf";
        
        console.log("Container:", containerRef.current);
        console.log("PDF URL:", pdfUrl);

        const instance = await window.PSPDFKit.load({
          container: containerRef.current,
          document: pdfUrl,
          baseUrl: `${window.location.origin}/nutrient-sdk/`,
          licenseKey: null // Trial mode
        });

        console.log("PSPDFKit instance created:", instance);
        setLoading(false);

      } catch (err) {
        console.error("Test error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (containerRef.current) {
      loadAndTest();
    }
  }, []);

  if (loading) {
    return <div>Loading PDF test...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', border: '1px solid red' }}>
        <h3>Error:</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <h3>PDF Test</h3>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '500px', 
          border: '1px solid #ccc'
        }}
      />
    </div>
  );
};

export default PDFTest;
