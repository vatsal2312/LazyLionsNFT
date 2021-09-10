import Image from "next/image";
import { SignInWithEthereum } from "../components/SignInWithEthereum";
import Container from "../components/container";
import styles from "../styles/Home.module.css";
import { getClient } from '../lib'
import { publicUsersFilter } from '../lib/users'

export async function getServerSideProps(context) {
  const prisma = await getClient()
  const count = await prisma.user.count({
    where: publicUsersFilter
  })

  // Idk, I just made this up. It's horrendous. There's probably a simpler way of doing it.
  const bases = Math.pow(10, Math.floor(Math.log10(count) - 1))
  const marketingCount = Math.floor(count / bases) * bases

  return {
    props: {
      usersCount: marketingCount
    },
  }
}

export default function Home({ usersCount }) {
  return (
    <div className={styles.home}>
      <div className={styles.blackBackgroundWrap}>
        <div className={styles.blackBackground} />
      </div>
      <div className={styles.brownBackground} />
      <Container>
        <div className={styles.main}>
          <div className={styles.leftSide}>
            <p className={styles.welcomMessage}>Welcome to Lazy Lions</p>

            <div className={styles.logo}>
              <Image
                src="/roarwards-logo-rev.png"
                width="400px"
                height="85px"
                alt="lazy lions logo"
              />
            </div>

            <div className={styles.textBox}>
              <p>ROARwards for Lazy Lions owners.</p>
              <p>
                To get started, connect your Ethereum wallet and sign in with
                your Twitter and Discord profiles to start earning ROARwards.
              </p>
              <p>
                Plus, see all the other Kings and Queens who have joined the
                ROARwards.
              </p>
            </div>

            <div className={styles.mainHeading}>
              <p>
                JOIN THE {usersCount}+ MEMBERS
                <br />
                WHO’VE SIGNED UP ALREADY
              </p>
            </div>
          </div>
          <div className={styles.rightSide}>
            <div className={styles.ctaBox}>
              <Image
                src="/Lazy-Lions.png"
                alt="lion"
                width="450"
                height="450"
              />
              <SignInWithEthereum />
            </div>
            <p className={styles.connetAccountTitle}>
              Connect your Ethereum wallet now to start getting ROARwarded!
            </p>
          </div>
        </div>

        <footer className={styles.footerDesktop}>
          <div>
            <p>&copy; Blockchain Media</p>
            <ul>
              <li>
                <a
                  href="https://bcm.media/privacy-policy-lazy-lions/"
                  className={styles.footerLeftLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>

              <li>
                <a
                  href="https://bcm.media/terms-of-use-lazy-lions/"
                  className={styles.footerLeftLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>

          <ul className={styles.desktopFooterNav}>
            <li>
              <a
                href="https://discord.gg/E9zY6XXp84"
                className={styles.footerRightLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Support
              </a>
            </li>
            <li>
              <a
                href="https://lazylionsnft.com/"
                className={styles.footerRightLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                lazylionsnft.com
              </a>
            </li>
          </ul>
        </footer>
      </Container>
      <footer className={styles.footer}>
        <Container>
          <p>&copy; Blockchain Media</p>

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

            <li>
              <a
                href="https://discord.gg/E9zY6XXp84"
                target="_blank"
                rel="noopener noreferrer"
              >
                Support
              </a>
            </li>
          </ul>
        </Container>
      </footer>
    </div>
  );
}
