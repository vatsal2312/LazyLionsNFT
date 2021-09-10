/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import clsx from "clsx";
import Tooltip from "../components/tooltip";
import TwitterIcon from "../components/icons/Twitter";
import DiscordIcon from "../components/icons/DiscordIcon";
import { Button } from "../components/Button";
import Pagination from "../components/pagination";
import styles from "../styles/Dashboard.module.css";
import { useSession } from "next-auth/client";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import { signOut, signIn } from 'next-auth/client'
import Head from "next/head";
const _ = require('lodash')

function formatEthAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(address.length - 4)}`;
}


async function getUsers(pageNumber, count, sortBy) {
  const skip = Math.max(pageNumber, 0) * USERS_PER_PAGE
  const take = USERS_PER_PAGE

  const params = new URLSearchParams({
    skip,
    take,
    sortBy
  })
  const users = await fetch(`/api/users?${params}`).then(res =>
    res.json()
  )

  const total = users.count;
  
  const data = users.data.map(user => {
    return {
      id: user.id,
      username: _.get(user, 'twitterProfile.screen_name', ''),
      photo: _.get(user, 'twitterProfile.profile_image_url', ''),
      isDiamondMember: _.get(user, 'checks.diamondPaws', false),
      donatedToCharity: _.get(user, 'willDonate', false),
    };
  })

  return {
    total,
    data
  };
}

const sortOptions = [
  // TODO:
  // { value: "diamond-paws", label: "Diamond Paws" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "newest", label: "Newest Members" },
];

const USERS_PER_PAGE = 21;
const IPFS_NODE_URL = 'https://mypinata.cloud/ipfs/'

async function getProfile() {
    const res = await fetch(`/api/users/my-profile`)
    return await res.json()
}

async function getLions() {
  const res = await fetch(`/api/users/my-lions`)
  return await res.json()
}

async function disconnectProvider(providerId) {
  const response = await fetch('/api/users/disconnect', {
    method: 'POST',
    body: JSON.stringify({
      providerId
    })
  })
}

async function changeDonationStatus(willDonate) {
  const response = await fetch('/api/users/update-donation', {
    method: 'POST',
    body: JSON.stringify({
      willDonate
    })
  })
}


async function getData() {
  const profile = await getProfile()
  const lions = await getLions()
  
  const user = {
    address: profile.user.ethereumAccount.address,
    // TODO: https://i.pravatar.cc/150?img=12
    avatar: _.get(profile, 'user.twitterProfile.profile_image_url', '').replace('_normal', ''),
    twitter: {
      isConnected: !!profile.user.twitterProfile,
      username: _.get(profile, 'user.twitterProfile.screen_name', '')
    },
    discord: {
      isConnected: !!profile.user.discordProfile,
      username: _.get(profile, 'user.discordProfile.username', ''),
    },
    isDiamondMember: profile.user.check.diamondPaws,
    donatedToCharity: profile.user.willDonate,
    isPfpCompleted: profile.user.check.hasPFP,
    isEmojiCompleted: profile.user.check.hasEmoji,
    lions: lions.map(({ id, imageIPFS }) => {
      return {
        id,
        photo: `${IPFS_NODE_URL}/${imageIPFS}`,
        url: `https://opensea.io/assets/0x8943c7bac1914c9a7aba750bf2b6b09fd21037e0/${id}`
      };
    })
  };

  return {
    profile,
    user
  }
}

const Dashboard = () => {
  const [selectedSortOption, setSelectedSortOption] = useState(sortOptions[0]);

  // Pagination
  const [totalUsers, setTotalUsers] = useState(0);
  const [users, setUsers] = useState(null);
  const [pageStatus, setPageStatus] = useState("idle");

  // Modal
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isIconInfoModalOpen, setIsIconInfoModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isThanksModalOpen, setIsThanksModalOpen] = useState(false);

  const openDisconnectModal = () => {
    setIsDisconnectModalOpen(true);
  };

  const signOutFromAccount = async () => {
    await signOut()
    setIsDisconnectModalOpen(false);
    router.push('/')
  }

  const closeDisconnectModal = () => {
    setIsDisconnectModalOpen(false);
  };

  const openIconInfoModal = () => {
    setIsIconInfoModalOpen(true);
  };

  const closeIconInfoModal = () => {
    setIsIconInfoModalOpen(false);
  };

  const openDonationModal = () => {
    setIsDonationModalOpen(true);
  };

  const closeDonationModal = () => {
    setIsDonationModalOpen(false);
  };

  const openThanksModal = () => {
    setIsThanksModalOpen(true);
  };

  const closeThanksModal = () => {
    setIsThanksModalOpen(false);
  };

  useEffect(() => {
    const fetchUsers = async (sortOption) => {
      setPageStatus("loading");
      const users = await getUsers(0, USERS_PER_PAGE, sortOption);
      setTotalUsers(users.total);
      setUsers(users.data);
      setPageStatus("loaded");
    };

    fetchUsers(selectedSortOption.value);
  }, [selectedSortOption]);

  const handlePageChange = async (page) => {
    // TODO: ugly.
    const sortOption = selectedSortOption.value
    const users = await getUsers(page, USERS_PER_PAGE, sortOption);
    setUsers(users.data);
  };

  const router = useRouter();
  const [session, loading] = useSession()
  // TODO: refetchOnMount is just a workaround for my dumb ass not having intricate knowledge
  // of React's remounting. Nonetheless, it works. I am an engineer.
  const { isLoading, error, data, refetch } = useQuery('get-data', getData, { refetchOnMount: false })
  
  if (loading) return ''

  if (!session) {
    window.location = '/'
    return
  }

  if (isLoading) return ''
  if (error) return error.toString()
  
  console.log(data)
  const { user } = data

  let pageOutPutJsx = null;

  if (pageStatus === "loaded") {
    pageOutPutJsx = (
      <>
        <Row className={styles.userCards}>
          {users.map((user) => (
            <Col
              key={user.id}
              xs={12}
              sm={6}
              md={4}
              className={styles.userCardItem}
            >
              <div
                className={clsx(styles.userCard, {
                  [styles.userCardDiamond]: user.isDiamondMember,
                })}
              >
                <img
                  src={user.photo}
                  // alt="user avatar"
                  className={styles.userCardAvatar}
                />
                <a href={`https://twitter.com/${user.username}`} className={styles.userCardUsername} target="_blank" rel="noopener noreferrer">
                  @{user.username}
                </a>

                <div className={styles.userCardIconBox}>
                  <div>
                    {user.isDiamondMember && (
                      <Image
                        src="/Diamond_Paw.png"
                        alt="diamond paw"
                        width={15}
                        height={15}
                      />
                    )}
                  </div>

                  {user.donatedToCharity && (
                    <Image
                      src="/charity-icon.png"
                      alt="charity icon"
                      width={15}
                      height={15}
                    />
                  )}
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <div className={styles.paginationBox}>
          {totalUsers > 0 && (
            <Pagination
              totalItems={totalUsers}
              pageSize={USERS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.dashboard}>
        <div className={styles.container}>
          <header className={styles.header}>
            <nav className={styles.navbar}>
              <div className={styles.nav_logo}>
                <Link href="/dashboard">
                    <Image
                      src="/roarwards-logo.png"
                      width={180}
                      height={45}
                      alt="lazy lions logo"
                    />
                </Link>
              </div>

              <ul className={styles.navbar_nav}>
                <li>
                  <Button size="sm" onClick={openDisconnectModal}>
                    {formatEthAddress(user.address)}
                  </Button>
                </li>
              </ul>
            </nav>
          </header>

          <Row className={styles.infoBox}>
            <Col
              xs={12}
              sm={5}
              md={4}
              className={clsx(styles.profileInfoBox, {
                [styles.diamondMemberProfileInfoBox]: user.isDiamondMember,
              })}
            >
              {user.isDiamondMember && (
                <div className={styles.diamondMemberIcon}>
                  <Tooltip title="Diamond Paws member">
                    <Image
                      src="/Diamond_Paw.png"
                      width={40}
                      height={40}
                      alt="Diamond Paws member"
                    />
                  </Tooltip>
                </div>
              )}

              {user.donatedToCharity && (
                <div className={styles.donatedToCharityMemberIcon}>
                  <Tooltip title="Pledged ROARwards to charity">
                    <Image
                      src="/charity-icon.png"
                      width={40}
                      height={40}
                      alt="Pledged ROARwards to charity"
                    />
                  </Tooltip>
                </div>
              )}
              <img
                src={user.avatar}
                alt="user profile"
                className={styles.userProfileImage}
              />
              <p className={styles.userEthAddress}>
                {formatEthAddress(user.address)}
              </p>

              <div className={styles.userIconsBox}>
                <div className={styles.iconItemBox}>
                  <div
                    className={clsx(styles.iconItem, {
                      [styles.iconItemGold]: user.isPfpCompleted,
                    })}
                  >
                    <button
                      className={clsx(styles.iconItemInfoButton, {
                        [styles.iconItemInfoGoldButton]: user.isPfpCompleted,
                      })}
                      onClick={openIconInfoModal}
                    >
                      i
                    </button>
                    <Image
                      src={
                        user.isPfpCompleted ? "/pfp-gold.png" : "/pfp-grey.png"
                      }
                      alt="pfp icon"
                      width={200}
                      height={195}
                    />
                    <p className={styles.iconItemTitle}>pfp</p>
                  </div>
                </div>

                <div className={styles.iconItemBox}>
                  <div
                    className={clsx(styles.iconItem, {
                      [styles.iconItemGold]: user.isEmojiCompleted,
                    })}
                  >
                    <button
                      className={clsx(styles.iconItemInfoButton, {
                        [styles.iconItemInfoGoldButton]: user.isEmojiCompleted,
                      })}
                      onClick={openIconInfoModal}
                    >
                      i
                    </button>
                    <Image
                      src={
                        user.isEmojiCompleted
                          ? "/emoji-icon-active.png"
                          : "/emoji-icon-grey.png"
                      }
                      alt="emoji icon"
                      width={200}
                      height={195}
                    />
                    <p className={styles.iconItemTitle}>emoji</p>
                  </div>
                </div>

                <div className={styles.iconItemBox}>
                  <div
                    className={clsx(styles.iconItem, {
                      [styles.iconItemGold]: user.isDiamondMember,
                    })}
                  >
                    <button
                      className={clsx(styles.iconItemInfoButton, {
                        [styles.iconItemInfoGoldButton]: user.isDiamondMember,
                      })}
                      onClick={openIconInfoModal}
                    >
                      i
                    </button>
                    <Image
                      src={
                        user.isDiamondMember
                          ? "/Diamond-Paw_Gold.png"
                          : "/Diamond-Paw_Silver.png"
                      }
                      alt="diamond paws"
                      width={200}
                      height={195}
                    />
                    <p className={styles.iconItemTitle}>diamond paws</p>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={7} md={8} className={styles.connectionsInfo}>
              <div className={styles.connectBox}>
                <div className={styles.connectBoxTitleBox}>
                  <p>twitter</p>
                  {user.twitter.isConnected && <button onClick={async () => {
                    await disconnectProvider('twitter')
                    await refetch()
                  }}>x</button>}
                </div>
                {user.twitter.isConnected ? (
                  <a href={`https://twitter.com/${user.twitter.username}`} className={styles.connectedUserLink}>
                    {user.twitter.username}
                  </a>
                ) : (
                    <a href='#' onClick={() => signIn('twitter')}>Connect now</a>
                )}
              </div>

              <div className={styles.connectBox}>
                <div className={styles.connectBoxTitleBox}>
                  <p>discord</p>
                  {user.discord.isConnected && <button onClick={async () => {
                    await disconnectProvider('discord')
                    await refetch()
                  }}>x</button>}
                </div>
                {user.discord.isConnected ? (
                  <a href="#" className={styles.connectedUserLink}>
                    {user.discord.username}
                  </a>
                ) : (
                    <a href='#' onClick={() => signIn('discord')}>Connect now</a>
                )}
              </div>

              <div className={styles.userLazyLionsBox}>
                <p>My Lazy Lions:</p>
                <div className={styles.userLazyLions}>
                  {user.lions.map((lion) => (
                    <div key={lion.id} className={styles.userLion}>
                      <a href={lion.url}><img src={lion.photo} alt="lion" /></a>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.donationButtonBox}>
                {user.donatedToCharity ? (
                  <p className={styles.donationPledgText}>
                    Thank you for pledging your ROARwards to charity
                  </p>
                ) : (
                  <Button color="gold" onClick={openDonationModal}>
                    <span>Donate</span>
                    <span>to charity</span>
                  </Button>
                )}
              </div>
            </Col>
          </Row>

          <section className={styles.prideSection}>
            <div className={styles.sectionInfoBox}>
              <div className={styles.sectionTitleBox}>
                <p className={styles.sectionTitle}>The Pride</p>
              </div>

              <div className={styles.sortOptionsBox}>
                <Form.Select
                  aria-label="sort members menu"
                  value={selectedSortOption.value}
                  onChange={(e) => {
                    const selectedOption = sortOptions.find(
                      (op) => op.value === e.target.value
                    );

                    setSelectedSortOption(selectedOption);
                  }}
                  className={styles.sortMenu}
                >
                  {sortOptions.map((op) => (
                    <option value={op.value} key={op.value}>
                      {op.label}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>

            {pageOutPutJsx}
          </section>

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
      </div>

      <Modal
        show={isDisconnectModalOpen}
        onHide={closeDisconnectModal}
        className={styles.disconnectModal}
        animation={false}
        centered
        dialogClassName={styles.disconnectDialog}
      >
        <Modal.Body>
          <div className={styles.disconnectModalBody}>
            <p className={styles.disconnectModalTitle}>
              You&apos;re about to disconnect your account
            </p>
            <p className={styles.disconnectModalDescription}>
              Are you sure you want to disconnect your wallet?
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className={styles.disconnectModalFooter}>
          <button
            className={[styles.disconnectModalCancelButton, "sheen"].join(" ")}
            onClick={closeDisconnectModal}
          >
            Cancel
          </button>
          <button className={styles.disconnectModalDisconnectButton} onClick={() => signOutFromAccount()}>
            Disconnect
          </button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isIconInfoModalOpen}
        onHide={closeIconInfoModal}
        className={styles.iconInfoModal}
        animation={false}
        centered
        dialogClassName={styles.iconInfoDialog}
      >
        <Modal.Body>
          <div className={styles.iconInfoModalBody}>
            <button
              onClick={closeIconInfoModal}
              className={styles.modalCloseIcon}
            >
              x
            </button>
            <p className={styles.iconInfoModalTitle}>What are these icons?</p>
            <p className={styles.iconInfoModalDescription}>
              These icons show you whether you have completed the required
              actions to receive your full ROARwards. When you have completed
              the required action, the image will change to gold.
            </p>

            <div className={styles.iconInfoTermDescriptionBox}>
              <p className={styles.iconInfoStepDescription}>
                <span>PFP:</span>
                Has your Twitter profile picture been updated to an image of
                your Lazy Lion NFT?
              </p>

              <p className={styles.iconInfoStepDescription}>
                <span>Emoji:</span>
                Do you have a lion emoji in your Twitter name or bio?
              </p>

              <p className={styles.iconInfoStepDescription}>
                <span>Diamond Paws:</span>
                Have you unlocked the Diamond Paws feature in Discord?
              </p>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={isDonationModalOpen}
        onHide={closeDonationModal}
        className={styles.iconInfoModal}
        animation={false}
        centered
        dialogClassName={styles.iconInfoDialog}
      >
        <Modal.Body>
          <div className={styles.iconInfoModalBody}>
            <button
              onClick={closeDonationModal}
              className={styles.modalCloseIcon}
            >
              x
            </button>
            <p className={styles.iconInfoModalTitle}>Confirm donation</p>
            <p className={styles.iconInfoModalDescription}>
              Please confirm that you approve your ROARwards amount to be
              donated to charity.
            </p>
          </div>
        </Modal.Body>

        <Modal.Footer className={styles.disconnectModalFooter}>
          <button
            className={styles.disconnectModalCancelButton}
            onClick={closeDonationModal}
          >
            Cancel
          </button>
          <Button
            size="sm"
            onClick={async () => {
              await changeDonationStatus(true);
              refetch()
              closeDonationModal();
              openThanksModal();
            }}
          >
            Approve
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isThanksModalOpen}
        onHide={closeThanksModal}
        className={styles.iconInfoModal}
        animation={false}
        centered
        dialogClassName={styles.iconInfoDialog}
      >
        <Modal.Body>
          <div className={styles.iconInfoModalBody}>
            <button
              onClick={closeThanksModal}
              className={styles.modalCloseIcon}
            >
              x
            </button>
            <p className={styles.iconInfoModalTitle}>
              Thank you for your pledge
            </p>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Dashboard;
