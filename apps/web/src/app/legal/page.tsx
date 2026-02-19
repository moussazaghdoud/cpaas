import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  description: "Legal information, terms of service, and privacy policy for Rainbow CPaaS.",
};

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="prose max-w-3xl">
        <h1>Legal</h1>
        <p>
          Rainbow CPaaS is provided by Alcatel-Lucent Enterprise.
          Legal documents and policies related to the platform are listed below.
        </p>

        <h2 id="terms">Terms of Service</h2>
        <p>
          By using Rainbow APIs and SDKs, you agree to the{" "}
          <a href="https://developers.openrainbow.com/legal" target="_blank" rel="noopener noreferrer">
            Rainbow Developer Terms of Service
          </a>.
        </p>

        <h2 id="privacy">Privacy Policy</h2>
        <p>
          For information on how we handle your data, please review the{" "}
          <a href="https://www.al-enterprise.com/en/legal" target="_blank" rel="noopener noreferrer">
            Alcatel-Lucent Enterprise Privacy Policy
          </a>.
        </p>

        <h2 id="third-party">Third-Party Notices</h2>
        <p>
          Rainbow SDKs may include third-party open-source software. License
          information is available in each SDK&apos;s documentation.
        </p>
      </div>
    </div>
  );
}
