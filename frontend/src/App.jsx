import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase";

const API_URL = "http://localhost:5000/api";

const emptyFood = {
  foodName: "",
  quantity: "",
  unit: "meals",
  location: "",
  availableUntil: "",
  donorName: "",
  donorPhone: "",
};

const emptyReceiver = {
  receiverName: "",
  receiverPhone: "",
  organization: "",
  pickupLocation: "",
};

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [role, setRole] = useState("");
  const [donorTab, setDonorTab] = useState("donate");

  const [food, setFood] = useState(emptyFood);
  const [receiver, setReceiver] = useState(emptyReceiver);
  const [receiverProfileSaved, setReceiverProfileSaved] =
    useState(false);

  const [donations, setDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [donorResponses, setDonorResponses] = useState([]);

  const [editingDonation, setEditingDonation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Keep each receiver profile separate for each signed-in account.
  const receiverProfileStorageKey = currentUser?.uid
    ? `foodbridge_receiver_profile_${currentUser.uid}`
    : currentUser?.email
    ? `foodbridge_receiver_profile_${currentUser.email.toLowerCase()}`
    : null;

  useEffect(() => {
    if (role !== "receiver" || !receiverProfileStorageKey) return;

    try {
      const savedProfile = localStorage.getItem(receiverProfileStorageKey);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setReceiver({ ...emptyReceiver, ...parsedProfile });
        setReceiverProfileSaved(true);
      } else {
        setReceiver(emptyReceiver);
        setReceiverProfileSaved(false);
      }
    } catch (error) {
      console.error("Could not load receiver profile:", error);
      setReceiver(emptyReceiver);
      setReceiverProfileSaved(false);
    }
  }, [role, receiverProfileStorageKey]);

  // ---------------- FETCH DATA ----------------

  const fetchDonations = async () => {
    try {
      const response = await axios.get(`${API_URL}/donations`);
      setDonations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Fetching donations failed:", error);
    }
  };

  const fetchMyDonations = async () => {
    if (!currentUser?.email) return;

    try {
      const response = await axios.get(
        `${API_URL}/donations/mine/${encodeURIComponent(
          currentUser.email
        )}`
      );

      setMyDonations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Fetching my donations failed:", error);
    }
  };

  const fetchDonorResponses = async () => {
    if (!currentUser?.email) return;

    try {
      const response = await axios.get(
        `${API_URL}/donations/responses/${encodeURIComponent(
          currentUser.email
        )}`
      );

      setDonorResponses(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Fetching responses failed:", error);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (currentUser?.email && role === "donor") {
      fetchMyDonations();
      fetchDonorResponses();
    }
  }, [currentUser, role]);

  // ---------------- AUTH ----------------

  const handleAuth = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const credential = isSignup
        ? await createUserWithEmailAndPassword(
            auth,
            email,
            password
          )
        : await signInWithEmailAndPassword(
            auth,
            email,
            password
          );

      setCurrentUser(credential.user);
      setIsLoggedIn(true);
      setShowLanding(false);
      setRole("");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setIsLoggedIn(false);
      setShowLanding(true);
      setCurrentUser(null);
      setRole("");
      setDonorTab("donate");
      setEditingDonation(null);
    } catch (error) {
      alert("Logout failed.");
    }
  };

  // ---------------- FORM HANDLERS ----------------

  const handleFoodChange = (e) => {
    setFood((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleReceiverChange = (e) => {
    setReceiver((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const saveReceiverProfile = (e) => {
    e.preventDefault();

    if (
      !receiver.receiverName ||
      !receiver.receiverPhone ||
      !receiver.organization ||
      !receiver.pickupLocation
    ) {
      alert("Please fill in all receiver profile details.");
      return;
    }

    if (!receiverProfileStorageKey) {
      alert("Please login before saving your receiver profile.");
      return;
    }

    try {
      const profileToSave = {
        receiverName: receiver.receiverName.trim(),
        receiverPhone: receiver.receiverPhone.trim(),
        organization: receiver.organization.trim(),
        pickupLocation: receiver.pickupLocation.trim(),
      };

      localStorage.setItem(
        receiverProfileStorageKey,
        JSON.stringify(profileToSave)
      );
      setReceiver(profileToSave);
      setReceiverProfileSaved(true);
      alert("Receiver profile saved successfully.");
    } catch (error) {
      console.error("Could not save receiver profile:", error);
      alert("Could not save receiver profile. Please try again.");
    }
  };

  // ---------------- CREATE DONATION ----------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?.email) {
      alert("Please login first.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...food,
        quantity: Number(food.quantity),
        donorEmail: currentUser.email,
      };
      console.log("Donation payload:", payload);
      await axios.post(`${API_URL}/donations`, payload);

      alert("Food donation posted successfully!");
      setFood(emptyFood);

      await fetchDonations();
      await fetchMyDonations();
    } catch (error) {
  console.error("Donation error:", error);
  console.error("Backend response:", error.response?.data);

  alert(
    error.response?.data?.error ||
    error.response?.data?.message ||
    "Could not post donation. Please try again."
  );
} finally {
  setLoading(false);
}
  };

  // ---------------- EDIT DONATION ----------------

  const startEditing = (item) => {
    if (item.status !== "AVAILABLE") {
      alert("Only available donations can be edited.");
      return;
    }

    setEditingDonation({
      ...item,
      availableUntil: toLocalDateTime(item.availableUntil),
    });
  };

  const handleEditChange = (e) => {
    setEditingDonation((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdateDonation = async (e) => {
    e.preventDefault();

    if (!editingDonation || !currentUser?.email) return;

    try {
      setLoading(true);

      const payload = {
        foodName: editingDonation.foodName,
        quantity: Number(editingDonation.quantity),
        unit: editingDonation.unit || "meals",
        location: editingDonation.location,
        availableUntil: editingDonation.availableUntil,
        donorEmail: currentUser.email,
      };

      await axios.put(
        `${API_URL}/donations/${editingDonation._id}`,
        payload
      );

      alert("Donation updated successfully.");
      setEditingDonation(null);

      await fetchMyDonations();
      await fetchDonations();
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Could not update donation."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DELETE DONATION ----------------

  const handleDeleteDonation = async (item) => {
    if (!currentUser?.email) return;

    if (item.status !== "AVAILABLE") {
      alert("Only available donations can be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.foodName}"?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/donations/${item._id}`, {
        data: {
          donorEmail: currentUser.email,
        },
      });

      alert("Donation deleted successfully.");

      await fetchMyDonations();
      await fetchDonations();
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Could not delete donation."
      );
    }
  };

  // ---------------- CLAIM DONATION ----------------

  const handleClaim = async (item) => {
    if (!receiverProfileSaved) {
      alert("Please save your Receiver Profile first.");
      return;
    }

    try {
      await axios.patch(`${API_URL}/donations/${item._id}/claim`, {
        receiverName: receiver.receiverName,
        receiverPhone: receiver.receiverPhone,
        organization: receiver.organization,
        pickupLocation: receiver.pickupLocation,
      });

      alert("Donation request submitted successfully.");
      await fetchDonations();
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Could not claim this donation."
      );
    }
  };

  // ---------------- LANDING PAGE ----------------

  if (showLanding && !isLoggedIn) {
    return (
      <div className="landing-page">
        <nav className="landing-navbar">
          <a
            href="#home"
            className="landing-logo"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="logo-symbol">♧</span>
            <span>
              Food<span>Bridge</span>
            </span>
          </a>

          <div className="landing-nav-links">
            <a href="#home" className="active">
              Home
            </a>
            <a href="#about">About</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="landing-nav-actions">
            <button
              className="landing-login-btn"
              onClick={() => {
                setShowLanding(false);
                setIsSignup(false);
              }}
            >
              Login
            </button>

            <button
              className="landing-start-btn"
              onClick={() => {
                setShowLanding(false);
                setIsSignup(true);
              }}
            >
              Get Started <span>→</span>
            </button>
          </div>
        </nav>

        <main id="home">
          <section className="landing-hero">
            <div className="hero-copy">
              <div className="hero-label">
                <span className="label-dot" />
                FOOD SHARING • COMMUNITY IMPACT
              </div>

              <h1>
                Food<span className="bridge-text">Bridge</span>
                <span className="hero-dash">.</span>
              </h1>

              <h2>
                Share Food.
                <br />
                <span>Spread Happiness.</span>
              </h2>

              <p className="hero-description">
                FoodBridge connects food donors with people and
                organizations in need. Together, we can reduce food
                waste and make sure good food reaches those who need it.
              </p>

              <div className="hero-cta">
                <button
                  className="hero-donate-btn"
                  onClick={() => {
                    setShowLanding(false);
                    setIsSignup(false);
                  }}
                >
                  <span className="cta-icon">♡</span>
                  Donate Food
                  <span className="cta-arrow">→</span>
                </button>

                <button
                  className="hero-receive-btn"
                  onClick={() => {
                    setShowLanding(false);
                    setIsSignup(true);
                  }}
                >
                  <span className="cta-icon">♧</span>
                  Receive Food
                </button>
              </div>

              <div className="hero-trust">
                <div className="trust-avatars">
                  <span>D</span>
                  <span>R</span>
                  <span>F</span>
                </div>

                <p>
                  <strong>Connecting communities</strong>
                  <br />
                  One meal at a time
                </p>
              </div>
            </div>

            <div className="hero-visual">
              <div className="image-decoration decoration-one" />
              <div className="image-decoration decoration-two" />

              <div className="hero-image-blob">
                <img
                  src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85"
                  alt="Fresh food prepared for sharing"
                />
              </div>

              <div className="floating-message">
                <div className="message-icon">♡</div>
                <div>
                  <strong>Food shared</strong>
                  <p>Hope delivered</p>
                </div>
              </div>

              <div className="floating-meal-card">
                <div className="meal-card-icon">♧</div>
                <div>
                  <strong>Every meal matters</strong>
                  <p>Make a difference today</p>
                </div>
              </div>
            </div>
          </section>

          <section className="impact-strip">
            <div className="impact-item">
              <div className="impact-icon">♡</div>
              <div>
                <h3>Share</h3>
                <p>Surplus food</p>
              </div>
            </div>

            <div className="impact-item">
              <div className="impact-icon">♧</div>
              <div>
                <h3>Connect</h3>
                <p>Local communities</p>
              </div>
            </div>

            <div className="impact-item">
              <div className="impact-icon">✦</div>
              <div>
                <h3>Support</h3>
                <p>People in need</p>
              </div>
            </div>

            <div className="impact-item">
              <div className="impact-icon">♻</div>
              <div>
                <h3>Reduce</h3>
                <p>Food waste</p>
              </div>
            </div>
          </section>

          <section className="landing-about" id="about">
            <p className="section-eyebrow">ABOUT FOODBRIDGE</p>
            <h2>
              A small connector.
              <br />
              <span>A big difference.</span>
            </h2>
            <p>
              FoodBridge is a food-sharing platform that brings donors,
              individuals, and organizations together. We help surplus
              food find a meaningful destination instead of going to waste.
            </p>
          </section>

          <section
            className="landing-about"
            id="how-it-works"
          >
            <p className="section-eyebrow">HOW IT WORKS</p>
            <h2>
              Simple steps.
              <br />
              <span>Meaningful impact.</span>
            </h2>
            <p>
              Donors list available food, receivers discover nearby
              donations, and both sides coordinate to make food sharing
              easier and more accessible.
            </p>
          </section>

          <section className="landing-about" id="contact">
            <p className="section-eyebrow">GET INVOLVED</p>
            <h2>
              Be part of the
              <br />
              <span>FoodBridge community.</span>
            </h2>
            <p>
              Whether you have food to share or need food support,
              FoodBridge helps bring people together.
            </p>

            <button
              className="landing-start-btn"
              onClick={() => {
                setShowLanding(false);
                setIsSignup(true);
              }}
            >
              Join FoodBridge <span>→</span>
            </button>
          </section>
        </main>
      </div>
    );
  }

  // ---------------- LOGIN / SIGNUP ----------------

  if (!isLoggedIn) {
    return (
      <div className="app">
        <nav className="navbar">
          <h2 className="logo">FoodBridge</h2>
          <button
            className="secondary-btn"
            onClick={() => setShowLanding(true)}
          >
            Back to Home
          </button>
        </nav>

        <section className="donation-section">
          <form className="donation-form" onSubmit={handleAuth}>
            <h2>
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>

            <p>
              {isSignup
                ? "Join FoodBridge and make a difference."
                : "Login to continue to FoodBridge."}
            </p>

            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isSignup
                ? "Sign Up"
                : "Login"}
            </button>

            <p>
              {isSignup
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsSignup((previous) => !previous)}
              >
                {isSignup ? "Login" : "Sign Up"}
              </button>
            </p>
          </form>
        </section>
      </div>
    );
  }

  // ---------------- ROLE SELECTION ----------------

  if (!role) {
    return (
      <div className="app">
        <nav className="navbar">
          <h2 className="logo">FoodBridge</h2>
          <button className="secondary-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>

        <section className="donation-section">
          <div className="donation-heading">
            <p className="tagline">WELCOME TO FOODBRIDGE</p>
            <h1>How would you like to help?</h1>
            <p>Choose your role to continue.</p>
          </div>

          <div className="role-container">
            <button
              className="primary-btn"
              onClick={() => setRole("donor")}
            >
              Food Donor
            </button>

            <button
              className="primary-btn"
              onClick={() => setRole("receiver")}
            >
              Food Receiver
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ---------------- DONOR DASHBOARD ----------------

  if (role === "donor") {
    return (
      <div className="app">
        <nav className="navbar">
          <h2 className="logo">FoodBridge</h2>

          <div>
            <span>{currentUser?.email}</span>
            <button className="nav-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>

        <section className="donation-list">
          <div className="donation-heading">
            <p className="tagline">DONOR DASHBOARD</p>
            <h1>Make a Difference</h1>
            <p>
              Share surplus food with people and organizations in need.
            </p>
          </div>

          <div className="role-container">
            <button
              className={
                donorTab === "donate" ? "primary-btn" : "secondary-btn"
              }
              onClick={() => setDonorTab("donate")}
            >
              Donate Food
            </button>

            <button
              className={
                donorTab === "responses"
                  ? "primary-btn"
                  : "secondary-btn"
              }
              onClick={() => {
                setDonorTab("responses");
                fetchDonorResponses();
              }}
            >
              Responses
            </button>

            <button
              className={
                donorTab === "myDonations"
                  ? "primary-btn"
                  : "secondary-btn"
              }
              onClick={() => {
                setDonorTab("myDonations");
                fetchMyDonations();
              }}
            >
              My Donations
            </button>
          </div>

          {donorTab === "donate" && (
            <form className="donation-form" onSubmit={handleSubmit}>
              <h2>Donate Food</h2>
              <p>Enter the details of the food you want to share.</p>

              <label>Food Name</label>
              <input
                name="foodName"
                placeholder="e.g. Fresh meals"
                value={food.foodName}
                onChange={handleFoodChange}
                required
              />

              <label>Quantity</label>
              <input
                name="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={food.quantity}
                onChange={handleFoodChange}
                required
              />

              <label>Unit</label>
              <select
                name="unit"
                value={food.unit}
                onChange={handleFoodChange}
              >
                <option value="meals">Meals</option>
                <option value="kg">Kg</option>
                <option value="packets">Packets</option>
                <option value="items">Items</option>
              </select>

              <label>Food Location</label>
              <input
                name="location"
                placeholder="Enter food location"
                value={food.location}
                onChange={handleFoodChange}
                required
              />

              <label>Available Until</label>
              <input
                name="availableUntil"
                type="datetime-local"
                value={food.availableUntil}
                onChange={handleFoodChange}
                required
              />

              <label>Donor Name</label>
              <input
                name="donorName"
                placeholder="Enter your name"
                value={food.donorName}
                onChange={handleFoodChange}
              />

              <label>Donor Phone</label>
              <input
                name="donorPhone"
                placeholder="Enter your phone number"
                value={food.donorPhone}
                onChange={handleFoodChange}
              />

              <button
                type="submit"
                className="primary-btn"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Post Donation"}
              </button>
            </form>
          )}

          {donorTab === "responses" && (
            <section>
              <div className="donation-heading">
                <h2>Donation Responses</h2>
              </div>

              {donorResponses.length === 0 ? (
                <p>No responses received yet.</p>
              ) : (
                <div className="donation-cards">
                  {donorResponses.map((item) => (
                    <article className="donation-card" key={item._id}>
                      <h3>{item.foodName}</h3>
                      <p>
                        Quantity: {item.quantity} {item.unit}
                      </p>
                      <p>Status: {item.status}</p>

                      {item.receiverName && (
                        <>
                          <p>Receiver: {item.receiverName}</p>
                          <p>Phone: {item.receiverPhone}</p>
                          <p>Organization: {item.organization}</p>
                          <p>
                            Pickup location: {item.pickupLocation}
                          </p>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {donorTab === "myDonations" && (
            <section>
              <div className="donation-heading">
                <h2>My Donations</h2>
                <p>Manage the food donations you have posted.</p>
              </div>

              {myDonations.length === 0 ? (
                <p>You have not posted any donations yet.</p>
              ) : (
                <div className="donation-cards">
                  {myDonations.map((item) => (
                    <article className="donation-card" key={item._id}>
                      <h3>{item.foodName}</h3>

                      <p>
                        Quantity: {item.quantity} {item.unit}
                      </p>
                      <p>Location: {item.location}</p>
                      <p>
                        Available Until:{" "}
                        {item.availableUntil
                          ? new Date(
                              item.availableUntil
                            ).toLocaleString()
                          : "Not specified"}
                      </p>
                      <p>Status: {item.status}</p>

                      {item.status === "AVAILABLE" ? (
                        <div className="card-actions">
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => startEditing(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => handleDeleteDonation(item)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <p>
                          This donation cannot be edited or deleted
                          because it is no longer available.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </section>

        {editingDonation && (
          <div className="modal-overlay">
            <form
              className="edit-modal donation-form"
              onSubmit={handleUpdateDonation}
            >
              <h2>Edit Donation</h2>

              <label>Food Name</label>
              <input
                name="foodName"
                value={editingDonation.foodName || ""}
                onChange={handleEditChange}
                required
              />

              <label>Quantity</label>
              <input
                name="quantity"
                type="number"
                min="1"
                value={editingDonation.quantity || ""}
                onChange={handleEditChange}
                required
              />

              <label>Unit</label>
              <select
                name="unit"
                value={editingDonation.unit || "meals"}
                onChange={handleEditChange}
              >
                <option value="meals">Meals</option>
                <option value="kg">Kg</option>
                <option value="packets">Packets</option>
                <option value="items">Items</option>
              </select>

              <label>Location</label>
              <input
                name="location"
                value={editingDonation.location || ""}
                onChange={handleEditChange}
                required
              />

              <label>Available Until</label>
              <input
                name="availableUntil"
                type="datetime-local"
                value={editingDonation.availableUntil || ""}
                onChange={handleEditChange}
                required
              />

              <div className="card-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingDonation(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ---------------- RECEIVER DASHBOARD ----------------
  // ---------------- RECEIVER DASHBOARD ----------------

if (role === "receiver") {
  const availableDonations = donations.filter(
    (item) => item.status === "AVAILABLE"
  );

  return (
    <div className="app">
      <nav className="navbar">
        <h2 className="logo">FoodBridge</h2>

        <div>
          <span>{currentUser?.email}</span>
          <button className="nav-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="donation-list">
        <div className="donation-heading">
          <p className="tagline">RECEIVER DASHBOARD</p>
          <h1>Find Food Near You</h1>
          <p>Discover available food donations from your community.</p>
        </div>

        {!receiverProfileSaved ? (
          <form
            className="donation-form"
            onSubmit={saveReceiverProfile}
          >
            <h2>Receiver Profile</h2>

            <label>Receiver Name</label>
            <input
              name="receiverName"
              placeholder="Enter your name"
              value={receiver.receiverName}
              onChange={handleReceiverChange}
              required
            />

            <label>Phone Number</label>
            <input
              name="receiverPhone"
              placeholder="Enter phone number"
              value={receiver.receiverPhone}
              onChange={handleReceiverChange}
              required
            />

            <label>Organization</label>
            <input
              name="organization"
              placeholder="Enter organization"
              value={receiver.organization}
              onChange={handleReceiverChange}
              required
            />

            <label>Pickup Location</label>
            <input
              name="pickupLocation"
              placeholder="Enter pickup location"
              value={receiver.pickupLocation}
              onChange={handleReceiverChange}
              required
            />

            <button type="submit" className="primary-btn">
              Save Receiver Profile
            </button>
          </form>
        ) : (
          <>
            <div className="donation-heading">
              <h2>Available Food Donations</h2>
            </div>

            {availableDonations.length === 0 ? (
              <p>No available donations right now.</p>
            ) : (
              <div className="donation-cards">
                {availableDonations.map((item) => (
                  <article className="donation-card" key={item._id}>
                    <h3>{item.foodName}</h3>

                    <p>
                      Quantity: {item.quantity} {item.unit}
                    </p>

                    <p>Location: {item.location}</p>

                    <p>
                      Available Until:{" "}
                      {item.availableUntil
                        ? new Date(item.availableUntil).toLocaleString()
                        : "Not specified"}
                    </p>

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => handleClaim(item)}
                    >
                      Request Donation
                    </button>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

return null;
}

export default App;