import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useDocTitle } from '../lib/hooks';
import './Pages.css';

export default function NotFound() {
  useDocTitle('Page not found');
  return (
    <section className="notfound container">
      <p className="num faint">404</p>
      <h1>We couldn’t find a face — or this page.</h1>
      <p className="lead">The link may be old, or the page has moved.</p>
      <div className="notfound__btns">
        <Link to="/" className="btn btn-primary btn-lg"><FiArrowLeft /> Back home</Link>
        <Link to="/contact" className="btn btn-outline btn-lg">Report a broken link</Link>
      </div>
    </section>
  );
}
