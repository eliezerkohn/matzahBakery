import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
	const navigate = useNavigate();

	const [phoneNumber, setPhoneNumber] = useState('');
	const [customer, setCustomer] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phoneNumber: '',
		address: '',
		apartment: '',
		city: '',
		state: '',
		zipCode: ''
	});
	const [needsRegistration, setNeedsRegistration] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const requiredCustomerFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'address', 'city', 'state', 'zipCode'];

	const getApiErrorMessage = (error, defaultMsg) => {
		if (error.response?.data?.message) {
			return error.response.data.message;
		}
		return defaultMsg;
	};

	const isCustomerComplete = () => requiredCustomerFields.every((field) => Boolean(customer[field]?.trim()));

	const goToOrderPage = (customerData) => {
		navigate('/order', {
			state: { customer: customerData }
		});
	};

	const handleCustomerChange = (event) => {
		const { name, value } = event.target;
		setCustomer((prev) => ({ ...prev, [name]: value }));
	};

	const handlePhoneInputChange = (event) => {
		const digitsOnly = event.target.value.replace(/\D/g, '');
		setPhoneNumber(digitsOnly);
	};

	const handlePhoneCheck = async () => {
		const cleanedPhone = phoneNumber.replace(/\D/g, '');
		if (!cleanedPhone) {
			return;
		}

		setIsLoading(true);
		setErrorMessage('');

		try {
			const response = await axios.get('/api/customers/varify', {
				params: { phone: cleanedPhone }
			});

			const foundCustomer = response.data;
			const customerId = foundCustomer?.customerId || foundCustomer?.id;

			if (customerId) {
				goToOrderPage(foundCustomer);
				return;
			}

			setCustomer(() => ({ ...customer, phoneNumber: cleanedPhone }));
			setNeedsRegistration(true);
		} catch (error) {
			const serverMessage = getApiErrorMessage(error, 'Could not verify customer. Please try again.');
			setErrorMessage(serverMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleContinue = async () => {
		if (!needsRegistration || !isCustomerComplete()) {
			return;
		}

		setIsLoading(true);
		setErrorMessage('');

		const payload = {
			firstName: customer.firstName.trim(),
			lastName: customer.lastName.trim(),
			email: customer.email.trim(),
			phoneNumber: customer.phoneNumber.replace(/\D/g, ''),
			address: customer.address.trim(),
			apartment: customer.apartment.trim(),
			city: customer.city.trim(),
			state: customer.state.trim(),
			zipCode: customer.zipCode.trim()
		};

		try {
			const response = await axios.post('/api/customers/add', payload);
			const createdCustomer = response.data || payload;
			goToOrderPage(createdCustomer);
		} catch (error) {
			const serverMessage = getApiErrorMessage(
				error,
				'Could not create customer. Please check backend validation and try again.'
			);
			setErrorMessage(serverMessage);
			setIsLoading(false);
		}
	};

	const handleGuestCheckout = () => {
		navigate('/order?guest=1', {
			state: { guestMode: true }
		});
	};

	return (
		<div className="container py-5">
			<h1 className="order-title mb-4">Customer Information</h1>
			<form className="row g-3" onSubmit={(event) => event.preventDefault()}>
				<div className="col-12 col-md-6">
					<label className="form-label">Phone Number</label>
					<input
						className="form-control"
						value={phoneNumber}
						onChange={handlePhoneInputChange}
						inputMode="numeric"
						pattern="[0-9]*"
					/>
				</div>
				<div className="col-12 col-md-6 d-flex align-items-end">
					<button type="button" className="btn btn-dark w-100" onClick={handlePhoneCheck} disabled={isLoading}>
						Check Phone Number
					</button>
				</div>

				<div className="col-12">
					<button type="button" className="btn btn-outline-secondary" onClick={handleGuestCheckout} disabled={isLoading}>
						Log In as Guest
					</button>
				</div>

				{needsRegistration && (
					<>
						<div className="col-12 col-md-6">
							<label className="form-label">First Name</label>
							<input
								className="form-control"
								name="firstName"
								value={customer.firstName}
								onChange={handleCustomerChange}
							/>
						</div>
						<div className="col-12 col-md-6">
							<label className="form-label">Last Name</label>
							<input
								className="form-control"
								name="lastName"
								value={customer.lastName}
								onChange={handleCustomerChange}
							/>
						</div>
						<div className="col-12 col-md-6">
							<label className="form-label">Email</label>
							<input
								type="email"
								className="form-control"
								name="email"
								value={customer.email}
								onChange={handleCustomerChange}
							/>
						</div>
						<div className="col-12">
							<label className="form-label">Delivery Address</label>
							<input
								className="form-control"
								name="address"
								value={customer.address}
								onChange={handleCustomerChange}
							/>
						</div>
						<div className="col-12 col-md-4">
							<label className="form-label">Apartment (Optional)</label>
							<input
								className="form-control"
								name="apartment"
								value={customer.apartment}
								onChange={handleCustomerChange}
							/>
						</div>
						<div className="col-12 col-md-3">
							<label className="form-label">City</label>
							<input
								className="form-control"
								name="city"
								value={customer.city}
								onChange={handleCustomerChange}
							/>
						</div>
						<div className="col-12 col-md-3">
							<label className="form-label">State</label>
							<input
								className="form-control"
								name="state"
								value={customer.state}
								onChange={handleCustomerChange}
							/>
						</div>
						<div className="col-12 col-md-2">
							<label className="form-label">Zip Code</label>
							<input
								className="form-control"
								name="zipCode"
								value={customer.zipCode}
								onChange={handleCustomerChange}
							/>
						</div>
					</>
				)}

				{needsRegistration && (
					<div className="col-12 d-flex gap-2 mt-3">
						<button
							type="button"
							className="btn btn-dark"
							disabled={!isCustomerComplete() || isLoading}
							onClick={handleContinue}
						>
							Continue to Order
						</button>
					</div>
				)}
				{errorMessage && <div className="col-12 text-danger">{errorMessage}</div>}
			</form>
		</div>
	);
};

export default Home;
