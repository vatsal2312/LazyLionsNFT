import Head from "next/head";
import Image from "next/image";
import { Container, Row, Col, Nav, Button } from "react-bootstrap";
import { signIn, useSession } from "next-auth/client";
import Link from "next/link";
const helloIntl = require("hello-international");

import styles from "../styles/layout.module.css";
import { SignInWithEthereum } from "./SignInWithEthereum";

export function Layout({ children }) {
  const [session, loading] = useSession();
  console.log(session);

  return (
    <div className={styles.page}>
      <Head>
        <title>LazyLions Roarwards</title>
        <meta name="description" content="LazyLions Roarwards" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container fluid>
        <Row className={styles.header}>
          <Col>
            <div style={{ float: "left" }} className={styles.title}>
              <Link href="/users">
                <img height={40} src="/logo.png" />
              </Link>
            </div>
            <div style={{ float: "right" }}>
              {/* <Button onClick={() => signIn('twitter')}>Sign in</Button> */}
              {!session && <SignInWithEthereum />}
              {!loading && session && session.user.ethereumAccount.address}
            </div>
          </Col>
        </Row>

        <Row className={styles.mainNavigation}>
          <Nav
            activeKey="/home"
            onSelect={(selectedKey) => alert(`selected ${selectedKey}`)}
          >
            <Nav.Item>
              <Nav.Link>
                <Link href="/users">Users</Link>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link>
                <Link href="/users/my-profile">My profile</Link>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Row>

        <Row className={styles.content}>
          <div className={styles.contentBody}>{children}</div>
        </Row>
      </Container>
    </div>
  );
}
