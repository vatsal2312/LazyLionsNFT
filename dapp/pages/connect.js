import React from "react";
import Link from "next/link";
import Image from "next/image";
import TwitterIcon from "../components/icons/Twitter";
import DiscordIcon from "../components/icons/DiscordIcon";
import { SignInWithEthereum } from "../components/SignInWithEthereum";
import Container from "../components/container";
import styles from "../styles/Connect.module.css";

const Connect = () => {
  return (
    <div className={styles.connect}>
      <Container style={{ height: "100%" }}>
        <div className={styles.root}>
          <header>
            <nav className={styles.navbar}>
              <div className={styles.nav_logo}>
                <Link href="/">
                  <a>
                    <Image
                      src="/roarwards-logo.png"
                      width={180}
                      height={45}
                      alt="lazy lions logo"
                    />
                  </a>
                </Link>
              </div>

              <ul className={styles.navbar_nav}>
                <li className={styles.connectButton}>
                  <SignInWithEthereum size="sm" />
                </li>
              </ul>
            </nav>
          </header>

          <main className={styles.main}>
            <p>Please connect your wallet to get started</p>
          </main>

          <footer className={styles.footer}>
            <div className={styles.footerCopyBox}>
              <p className={styles.footerCopy}>&copy; 2021 Blockchain Media</p>
              <ul>
                <li>
                  <a
                    href="https://bcm.media/privacy-policy-lazy-lions/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                </li>

                <li>
                  <a
                    href="https://bcm.media/terms-of-use-lazy-lions/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Use
                  </a>
                </li>
              </ul>
            </div>

            <ul className={styles.footerNav}>
              <li>
                <a
                  href="https://discord.gg/E9zY6XXp84"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="https://lazylionsnft.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  lazylionsnft.com
                </a>
              </li>
            </ul>

            <div className={styles.footerIconsBox}>
              <a
                href="https://twitter.com/LazyLionsNFT"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerIcon}
              >
                <TwitterIcon size={40} />
              </a>
              <a
                href="https://discord.gg/LazyLionsNFT"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerIcon}
              >
                <DiscordIcon size={40} />
              </a>
            </div>
          </footer>
        </div>
      </Container>
    </div>
  );
};

export default Connect;
