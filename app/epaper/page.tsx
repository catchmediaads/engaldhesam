"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration_days: number;
  is_active: boolean;
  sort_order: number;
};

type Subscription = {
  id: string;
  plan_id: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  payment_status: string;
};

type AccountInfo = {
  email: string;
  fullName: string;
  role: string;
};

const FINAL_PLANS = [
  { name: "Monthly", price: 199, days: 30, sort: 1 },
  { name: "Quarterly", price: 499, days: 90, sort: 2 },
  { name: "Annual", price: 1999, days: 365, sort: 3 },
];

export default function EPaperPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadEPaper() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: roleData, error: roleError } =
          await supabase.rpc("get_my_role");

        if (roleError) {
          console.error("Role detection error:", roleError);
        }

        const role =
          typeof roleData === "string" && roleData.trim()
            ? roleData.trim()
            : "reader";

        setAccount({
          email: user.email ?? "",
          fullName:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Reader",
          role,
        });

        setLoading(false);

        const { data: planData, error: planError } =
          await supabase
            .from("e_paper_plans")
            .select(
              "id, name, description, price, currency, duration_days, is_active, sort_order"
            )
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (planError) {
          console.error("Plan loading error:", planError);

          if (mounted) {
            setErrorMessage(
              "Unable to load E-Paper plans. Please refresh the page."
            );
          }
        } else {
          /*
           * Only show the three finalized plans.
           * This also protects the public page if old/duplicate
           * plans are still active in Supabase.
           */
          const validPlans: Plan[] = [];

          for (const finalPlan of FINAL_PLANS) {
            const matchingPlan = (planData ?? []).find(
              (plan) =>
                plan.name.toLowerCase() ===
                  finalPlan.name.toLowerCase() &&
                Number(plan.price) === finalPlan.price &&
                Number(plan.duration_days) === finalPlan.days
            );

            if (matchingPlan) {
              validPlans.push(matchingPlan);
            }
          }

          if (mounted) {
            setPlans(validPlans);
          }
        }

        setPlansLoading(false);

        const {
          data: subscriptionData,
          error: subscriptionError,
        } = await supabase
          .from("e_paper_subscriptions")
          .select(
            "id, plan_id, status, started_at, expires_at, payment_status"
          )
          .eq("user_id", user.id)
          .in("status", ["active", "pending", "suspended"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subscriptionError) {
          console.error(
            "Subscription loading error:",
            subscriptionError
          );
        } else if (mounted) {
          setSubscription(subscriptionData);
        }
      } catch (error) {
        console.error("E-Paper loading error:", error);

        if (mounted) {
          setErrorMessage(
            "Something went wrong while loading E-Paper."
          );
          setLoading(false);
          setPlansLoading(false);
        }
      }
    }

    loadEPaper();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const activePlan = useMemo(() => {
    if (!subscription) return null;

    return plans.find(
      (plan) => plan.id === subscription.plan_id
    );
  }, [plans, subscription]);

  function formatPrice(price: number, currency: string) {
    const symbol = currency === "INR" ? "₹" : currency;

    return `${symbol}${Number(price).toLocaleString("en-IN")}`;
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function isSubscriptionActive() {
    if (!subscription) return false;
    if (subscription.status !== "active") return false;

    if (!subscription.expires_at) return true;

    return (
      new Date(subscription.expires_at).getTime() >
      Date.now()
    );
  }

  if (loading) {
    return (
      <>
        <main className="epaper-page">
          <div className="epaper-loading">
            <div className="epaper-spinner" />
            <p>Loading E-Paper...</p>
          </div>
        </main>

        <EPaperStyles />
      </>
    );
  }

  if (!account) return null;

  const isSuperAdmin = account.role === "super_admin";
  const active = isSubscriptionActive();

  return (
    <>
      <main className="epaper-page">
        <div className="epaper-container">

          {/* Breadcrumb */}
          <nav className="epaper-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>E-Paper</span>
          </nav>

          {/* Page heading */}
          <header className="epaper-header">
            <div className="epaper-header-copy">
              <span className="epaper-kicker">
                எங்கள் தேசம் E-PAPER
              </span>

              <h1>Digital Newspaper</h1>

              <p>
                Read the digital edition of எங்கள் தேசம்
                from anywhere, anytime.
              </p>
            </div>

            <Link
              href="/account"
              className="epaper-account-button"
            >
              ← My Account
            </Link>
          </header>

          {/* Admin notice */}
          {isSuperAdmin && (
            <div className="epaper-admin-notice">
              <div className="notice-icon">⚙️</div>

              <div className="notice-content">
                <strong>Super Admin Access</strong>

                <p>
                  You are signed in as Super Admin. E-Paper
                  edition and subscription management can be
                  handled from the administration area.
                </p>
              </div>

              <Link href="/admin" className="notice-link">
                Admin Dashboard →
              </Link>
            </div>
          )}

          {/* Active subscription */}
          {active && subscription && (
            <section className="active-subscription">
              <div className="active-check">✓</div>

              <div className="active-info">
                <span>ACTIVE SUBSCRIPTION</span>

                <h2>
                  {activePlan?.name || "E-Paper"}
                </h2>

                <div className="active-meta">
                  <span>
                    Started:{" "}
                    <strong>
                      {formatDate(subscription.started_at)}
                    </strong>
                  </span>

                  <span>
                    Expires:{" "}
                    <strong>
                      {formatDate(subscription.expires_at)}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="read-button"
                disabled
              >
                Read E-Paper
              </button>
            </section>
          )}

          {/* Pending */}
          {subscription &&
            subscription.status === "pending" && (
              <section className="pending-subscription">
                <div className="pending-icon">⏳</div>

                <div>
                  <strong>
                    Subscription Payment Pending
                  </strong>

                  <p>
                    Your subscription is awaiting payment
                    confirmation.
                  </p>
                </div>
              </section>
            )}

          {/* Error */}
          {errorMessage && (
            <div className="epaper-error">
              {errorMessage}
            </div>
          )}

          {/* Plans */}
          <section className="plans-section">
            <div className="section-heading">
              <span>SUBSCRIPTION PLANS</span>

              <h2>Choose Your E-Paper Plan</h2>

              <p>
                Select a plan to access the digital
                newspaper editions.
              </p>
            </div>

            {plansLoading ? (
              <div className="plans-message">
                Loading subscription plans...
              </div>
            ) : plans.length !== 3 ? (
              <div className="plans-message plans-warning">
                <div className="warning-icon">📰</div>

                <h3>Subscription Plans</h3>

                <p>
                  The finalized plans are being prepared.
                  Please refresh after the plans are updated.
                </p>

                <div className="expected-plans">
                  <span>Monthly ₹199</span>
                  <span>Quarterly ₹499</span>
                  <span>Annual ₹1,999</span>
                </div>
              </div>
            ) : (
              <div className="plans-grid">
                {plans.map((plan) => {
                  const isAnnual =
                    plan.duration_days === 365;

                  const period =
                    plan.duration_days === 30
                      ? "month"
                      : plan.duration_days === 90
                        ? "quarter"
                        : "year";

                  return (
                    <article
                      key={plan.id}
                      className={`plan-card ${
                        isAnnual ? "plan-card-featured" : ""
                      }`}
                    >
                      {isAnnual && (
                        <div className="popular-badge">
                          POPULAR
                        </div>
                      )}

                      <div className="plan-icon">
                        📰
                      </div>

                      <h3>{plan.name}</h3>

                      <div className="plan-price">
                        {formatPrice(
                          plan.price,
                          plan.currency
                        )}
                        <span> / {period}</span>
                      </div>

                      <p className="plan-description">
                        {plan.description ||
                          `${plan.duration_days} days E-Paper access`}
                      </p>

                      <div className="plan-divider" />

                      <ul className="plan-features">
                        <li>✓ Digital newspaper access</li>
                        <li>
                          ✓ Mobile, tablet & desktop access
                        </li>
                        <li>✓ Subscription-based access</li>
                      </ul>

                      <button
                        type="button"
                        className="subscribe-button"
                        onClick={() =>
                          alert(
                            `Payment integration for ${plan.name} will be connected next.`
                          )
                        }
                      >
                        Subscribe —{" "}
                        {formatPrice(
                          plan.price,
                          plan.currency
                        )}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* How it works */}
          <section className="how-section">
            <div className="section-heading">
              <span>HOW IT WORKS</span>
              <h2>Get Your E-Paper in 3 Steps</h2>
            </div>

            <div className="steps-grid">

              <div className="step-card">
                <div className="step-number">01</div>
                <h3>Choose a Plan</h3>
                <p>
                  Select Monthly, Quarterly or Annual
                  subscription.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <h3>Make Payment</h3>
                <p>
                  Complete the secure payment process.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <h3>Read E-Paper</h3>
                <p>
                  Access available digital newspaper
                  editions.
                </p>
              </div>

            </div>
          </section>

          <div className="epaper-footer-note">
            <strong>எங்கள் தேசம்</strong>
            <span>
              Digital newspaper access for subscribed
              readers.
            </span>
          </div>

        </div>
      </main>

      <EPaperStyles />
    </>
  );
}

function EPaperStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      .epaper-page {
        min-height: calc(100vh - 150px);
        width: 100%;
        background: #fbfaf7;
        padding: 38px 20px 80px;
      }

      .epaper-container {
        width: min(1180px, 100%);
        margin: 0 auto;
      }

      .epaper-breadcrumb {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 24px;
        color: #777;
        font-size: 14px;
      }

      .epaper-breadcrumb a {
        color: #176b73;
        text-decoration: none;
        font-weight: 700;
      }

      .epaper-breadcrumb a:hover {
        text-decoration: underline;
      }

      .epaper-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 30px;
        margin-bottom: 30px;
      }

      .epaper-header-copy {
        min-width: 0;
      }

      .epaper-kicker {
        display: block;
        margin-bottom: 7px;
        color: #176b73;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1.4px;
      }

      .epaper-header h1 {
        margin: 0;
        color: #18212b;
        font-size: clamp(34px, 5vw, 50px);
        line-height: 1.08;
        letter-spacing: -0.8px;
      }

      .epaper-header p {
        margin: 10px 0 0;
        color: #6c7378;
        font-size: 16px;
        line-height: 1.55;
      }

      .epaper-account-button {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 18px;
        border: 1px solid #d9d7d0;
        border-radius: 8px;
        background: #fff;
        color: #18212b;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
      }

      .epaper-account-button:hover {
        border-color: #176b73;
        color: #176b73;
      }

      .epaper-admin-notice {
        display: flex;
        align-items: center;
        gap: 15px;
        width: 100%;
        margin-bottom: 28px;
        padding: 17px 19px;
        border: 1px solid #d6e5e3;
        border-radius: 13px;
        background: #eef5f4;
      }

      .notice-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 46px;
        height: 46px;
        flex: 0 0 46px;
        border-radius: 11px;
        background: #fff;
        font-size: 21px;
      }

      .notice-content {
        flex: 1;
        min-width: 0;
      }

      .notice-content strong {
        display: block;
        color: #18212b;
        font-size: 15px;
      }

      .notice-content p {
        margin: 4px 0 0;
        color: #667176;
        font-size: 13px;
        line-height: 1.5;
      }

      .notice-link {
        flex-shrink: 0;
        color: #176b73;
        text-decoration: none;
        font-size: 13px;
        font-weight: 800;
      }

      .active-subscription {
        display: flex;
        align-items: center;
        gap: 17px;
        width: 100%;
        margin-bottom: 30px;
        padding: 21px;
        border: 1px solid #b9d7cf;
        border-radius: 15px;
        background: #f0f8f5;
      }

      .active-check {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        flex: 0 0 52px;
        border-radius: 50%;
        background: #176b73;
        color: #fff;
        font-size: 23px;
        font-weight: 800;
      }

      .active-info {
        flex: 1;
        min-width: 0;
      }

      .active-info > span {
        color: #176b73;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.1px;
      }

      .active-info h2 {
        margin: 3px 0 7px;
        color: #18212b;
        font-size: 21px;
      }

      .active-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        color: #697478;
        font-size: 13px;
      }

      .active-meta strong {
        color: #18212b;
      }

      .read-button {
        flex-shrink: 0;
        min-height: 44px;
        padding: 0 18px;
        border: 0;
        border-radius: 8px;
        background: #176b73;
        color: #fff;
        font-size: 13px;
        font-weight: 800;
        opacity: 0.6;
        cursor: not-allowed;
      }

      .pending-subscription {
        display: flex;
        align-items: center;
        gap: 13px;
        width: 100%;
        margin-bottom: 28px;
        padding: 17px 19px;
        border: 1px solid #e4d6a8;
        border-radius: 12px;
        background: #fff9e8;
      }

      .pending-icon {
        font-size: 25px;
      }

      .pending-subscription strong {
        color: #54471e;
      }

      .pending-subscription p {
        margin: 3px 0 0;
        color: #776b43;
        font-size: 13px;
      }

      .epaper-error {
        width: 100%;
        margin-bottom: 25px;
        padding: 14px 17px;
        border: 1px solid #e2b5b0;
        border-radius: 9px;
        background: #fff3f1;
        color: #a13d35;
        font-size: 14px;
      }

      .plans-section {
        width: 100%;
        margin-top: 42px;
      }

      .section-heading {
        margin-bottom: 22px;
      }

      .section-heading > span {
        display: block;
        color: #176b73;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.2px;
      }

      .section-heading h2 {
        margin: 5px 0 7px;
        color: #18212b;
        font-size: 29px;
        line-height: 1.2;
      }

      .section-heading p {
        margin: 0;
        color: #72797d;
        font-size: 15px;
      }

      .plans-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
        width: 100%;
        align-items: stretch;
      }

      .plan-card {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        min-width: 0;
        min-height: 420px;
        padding: 27px;
        border: 1px solid #d9d7d0;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 7px 25px rgba(24, 33, 43, 0.05);
      }

      .plan-card-featured {
        border-color: #176b73;
        box-shadow: 0 10px 32px rgba(23, 107, 115, 0.12);
      }

      .popular-badge {
        position: absolute;
        top: 0;
        right: 20px;
        transform: translateY(-50%);
        padding: 5px 10px;
        border-radius: 20px;
        background: #176b73;
        color: #fff;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.8px;
      }

      .plan-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #eef3f2;
        font-size: 22px;
      }

      .plan-card h3 {
        margin: 17px 0 0;
        color: #18212b;
        font-size: 21px;
      }

      .plan-price {
        margin-top: 19px;
        color: #176b73;
        font-size: 34px;
        font-weight: 850;
        line-height: 1;
      }

      .plan-price span {
        color: #747b7f;
        font-size: 13px;
        font-weight: 600;
      }

      .plan-description {
        min-height: 43px;
        margin: 16px 0 0;
        color: #70777b;
        font-size: 14px;
        line-height: 1.5;
      }

      .plan-divider {
        width: 100%;
        height: 1px;
        margin: 18px 0;
        background: #eceae5;
      }

      .plan-features {
        display: flex;
        flex-direction: column;
        gap: 9px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .plan-features li {
        color: #50585c;
        font-size: 13px;
        line-height: 1.4;
      }

      .subscribe-button {
        width: 100%;
        min-height: 45px;
        margin-top: auto;
        padding: 0 16px;
        border: 0;
        border-radius: 9px;
        background: #176b73;
        color: #fff;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
      }

      .subscribe-button:hover {
        background: #125b62;
      }

      .plans-message {
        width: 100%;
        padding: 50px 20px;
        border: 1px dashed #d5d2cb;
        border-radius: 14px;
        background: #fff;
        text-align: center;
        color: #72797d;
      }

      .plans-warning {
        padding: 35px 20px;
      }

      .warning-icon {
        font-size: 34px;
      }

      .plans-warning h3 {
        margin: 10px 0 5px;
        color: #18212b;
        font-size: 19px;
      }

      .plans-warning p {
        margin: 0;
        font-size: 14px;
      }

      .expected-plans {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .expected-plans span {
        padding: 7px 11px;
        border-radius: 20px;
        background: #eef3f2;
        color: #176b73;
        font-size: 12px;
        font-weight: 800;
      }

      .how-section {
        width: 100%;
        margin-top: 60px;
      }

      .steps-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
      }

      .step-card {
        width: 100%;
        min-height: 155px;
        padding: 24px;
        border: 1px solid #dedbd5;
        border-radius: 13px;
        background: #fff;
      }

      .step-number {
        color: #176b73;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .step-card h3 {
        margin: 10px 0 7px;
        color: #18212b;
        font-size: 18px;
      }

      .step-card p {
        margin: 0;
        color: #72797d;
        font-size: 14px;
        line-height: 1.5;
      }

      .epaper-footer-note {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        width: 100%;
        margin-top: 45px;
        padding-top: 25px;
        border-top: 1px solid #dedbd5;
        color: #81878a;
        font-size: 12px;
        text-align: center;
      }

      .epaper-footer-note strong {
        color: #176b73;
      }

      .epaper-loading {
        min-height: 60vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 15px;
        color: #6c7378;
      }

      .epaper-spinner {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5e4;
        border-top-color: #176b73;
        border-radius: 50%;
        animation: epaper-spin 0.8s linear infinite;
      }

      @keyframes epaper-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 900px) {
        .plans-grid,
        .steps-grid {
          grid-template-columns: 1fr;
        }

        .plan-card {
          min-height: auto;
        }

        .epaper-admin-notice {
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .notice-link {
          margin-left: 61px;
        }
      }

      @media (max-width: 640px) {
        .epaper-page {
          padding: 25px 14px 60px;
        }

        .epaper-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .epaper-account-button {
          width: 100%;
        }

        .epaper-admin-notice {
          align-items: flex-start;
          flex-direction: column;
        }

        .notice-link {
          margin-left: 0;
        }

        .active-subscription {
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .read-button {
          width: 100%;
        }

        .plan-card {
          padding: 23px;
        }
      }
    `}</style>
  );
}
