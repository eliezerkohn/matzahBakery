const Contact = () => {
    return (
        <div className="container py-5 page-contact">
            <div className="page-hero mb-4">
                <h1 className="order-title mb-1">Contact Us</h1>
                <p className="page-subtitle mb-0">Reach us for orders, pickup timing, and seasonal availability.</p>
            </div>

            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h2 className="h5 mb-3">Our Location</h2>
                            <p className="mb-3">
                                38 Locust St
                                <br />
                                Brooklyn, NY 11206
                            </p>
                            <a
                                href="https://www.google.com/maps/search/?api=1&query=38+Locust+St,+Brooklyn,+NY+11206"
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-primary"
                            >
                                Get Directions
                            </a>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h2 className="h5 mb-3">Phone</h2>
                            <p className="mb-2">
                                <a href="tel:+17185222622" className="link-primary">(718) 522-2622</a>
                            </p>
                            <p className="text-muted mb-0">Call us for orders and inquiries</p>
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="h5 mb-3">Business Hours</h2>
                            <p className="mb-0">Please call us for current business hours and holiday schedules.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
