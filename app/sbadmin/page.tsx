export default function SBAdminPage() {
  return (
    <div id="wrapper">
      <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">
        <a className="sidebar-brand d-flex align-items-center justify-content-center" href="#">
          <div className="sidebar-brand-icon rotate-n-15">
            <i className="fas fa-laugh-wink" />
          </div>
          <div className="sidebar-brand-text mx-3">
            SB Admin <sup>2</sup>
          </div>
        </a>
      </ul>
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow" />
          <div className="container-fluid">
            <h1 className="h3 mb-4 text-gray-800">SB Admin 2 Demo</h1>
            <div className="row">
              <div className="col-lg-6">
                <div className="card shadow mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">Example Card</h6>
                  </div>
                  <div className="card-body">
                    This page demonstrates the <code>startbootstrap-sb-admin-2</code> theme in a Next.js app.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer className="sticky-footer bg-white">
          <div className="container my-auto">
            <div className="copyright text-center my-auto">
              <span>Copyright &copy; Your Website 2024</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

