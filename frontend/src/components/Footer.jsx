export default function Footer() {
  const githubUrl = import.meta.env.VITE_GITHUB_URL || 'https://github.com';

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo-row">
              <img src="/logo-icon.png" alt="AWS DevOps Incident Helper Logo" className="footer-logo-img" />
              <h4>AWS DevOps Incident Helper</h4>
            </div>
            <p>
              Built with Amazon Bedrock.<br />
              For learning, troubleshooting, and building better on AWS.
            </p>
          </div>

          <div className="footer-links">
            <a 
              href={githubUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link"
            >
              GitHub
            </a>
            <a 
              href="https://aws.amazon.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link"
            >
              AWS
            </a>
            <a 
              href="https://aws.amazon.com/bedrock/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link"
            >
              Amazon Bedrock
            </a>
            <a 
              href="#top" 
              className="footer-link"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} AWS DevOps Incident Helper. All rights reserved.</span>
          <span>AWS Weekend Deployment Challenge • Serverless & Bedrock Nova 2 Lite</span>
        </div>
      </div>
    </footer>
  );
}
