import { useEffect, useRef } from 'react';

export default function Logo() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchAndRenderSvg = async () => {
      try {
        const response = await fetch('/logo.svg');
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDocument = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = (svgDocument.documentElement as unknown) as SVGSVGElement;

        // Clone the paths and apply theme-aware styling
        const paths = svgElement.querySelectorAll('path');
        paths.forEach((path) => {
          path.classList.add('logo-path');
        });

        if (svgRef.current) {
          svgRef.current.innerHTML = svgElement.innerHTML;
        }
      } catch (error) {
        console.error('Failed to load logo SVG:', error);
      }
    };

    fetchAndRenderSvg();
  }, []);

  return (
    <div className="brand-logo">
      <svg
        ref={svgRef}
        viewBox="0 0 500 500"
        className="logo-svg"
        xmlns="http://www.w3.org/2000/svg"
      />
    </div>
  );
}
