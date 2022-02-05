import { ethers } from "ethers";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import EthersSafe from "@gnosis.pm/safe-core-sdk";

import GnosisSafeArtifact from "../contracts/GnosisSafe.json";
import CMORegistryArtifact from "../contracts/CMORegistry.json";
import { useDropzone } from "react-dropzone";

import IPFSUtils from "../utils/ipfs";
import trash from "../image/trash.jpg";

export default function RegisterCopyright() {
  const [safeContractInstance, setSafeContractInstance] = useState(null);

  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [cid, setCid] = useState("");

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [year, setYear] = useState(0);
  const [description, setDescription] = useState("");

  const [members, setMembers] = useState([]);
  const [shares, setShares] = useState([]);

  const [lyricistsLastName, setLyricistsLastName] = useState([]);
  const [lyricistsFirstName, setLyricistsFirstName] = useState([]);

  const [tags, setTags] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    setFileName(acceptedFiles[0].name);
    console.log("acceptedFiles[0]", acceptedFiles[0]);
    setFileContent(acceptedFiles[0].content);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  async function deployMultiSig() {
    const _cid = await IPFSUtils.upload({
      title,
      description,
      duration,
      year,
      lyricistsLastName,
      lyricistsFirstName,
      tags,
      content: fileName.toString("base64"),
    });

    console.log("_cid", _cid, fileContent);
    setCid(_cid);

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    await provider.send("eth_requestAccounts", []);

    const signer = provider.getSigner();

    const safeContractFactory = new ethers.ContractFactory(
      GnosisSafeArtifact.abi,
      GnosisSafeArtifact.bytecode,
      signer
    );

    try {
      let _safeContractInstance = await safeContractFactory.deploy();

      const txReceipt = await _safeContractInstance.deployTransaction.wait();

      if (txReceipt) {
        const setupSafeTx = await _safeContractInstance.setup(
          members,
          members.length,
          ethers.constants.AddressZero,
          ethers.utils.toUtf8Bytes(""),
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          0,
          ethers.constants.AddressZero
        );

        const txReceipt = await setupSafeTx.wait();

        if (txReceipt) {
          setSafeContractInstance(_safeContractInstance);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function signTx() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();

      const cmoRegistry = new ethers.Contract(
        // process.env.NEXT_PUBLIC_CMO_CONTRACT_ADDRESS,
        "0x7Ce73F8f636C6bD3357A0A8a59e0ab6462C955B0",
        CMORegistryArtifact.abi,
        signer
      );

      const submitCidTx = await cmoRegistry.populateTransaction.submitCid(
        cid,
        members,
        shares
      );

      const safeSdk = await EthersSafe.create(
        ethers,
        safeContractInstance.address,
        signer
      );

      const safeTransaction = await safeSdk.createTransaction({
        ...submitCidTx,
        value: "0",
      });

      const txHash = await safeSdk.getTransactionHash(safeTransaction);

      const approveTxResponse = await safeSdk.approveTransactionHash(txHash);

      const txReceipt = await approveTxResponse.wait();

      console.log(txReceipt);
    } catch (err) {
      console.error(err);
    }
  }

  async function confirmTx() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();

      const cmoRegistry = new ethers.Contract(
        // process.env.NEXT_PUBLIC_CMO_CONTRACT_ADDRESS,
        "0x7Ce73F8f636C6bD3357A0A8a59e0ab6462C955B0",
        CMORegistryArtifact.abi,
        signer
      );

      const submitCidTx = await cmoRegistry.populateTransaction.submitCid(
        cid,
        members,
        shares
      );

      const safeSdk = await EthersSafe.create(
        ethers,
        safeContractInstance.address,
        signer
      );

      const safeTransaction = await safeSdk.createTransaction({
        ...submitCidTx,
        value: "0",
      });

      const executeTxResponse = await safeSdk.executeTransaction(
        safeTransaction
      );
      const txReceipt = await executeTxResponse.wait();

      console.log(txReceipt);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Head>
        <title>CMOFrontend</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <h1 className="text-4xl font-bold">Register copyright</h1>
        <h2 className="font-bold text-2xl mt-8 mb-2">Stuff to copyright</h2>
        <div className="space-y-2 p-4 flex flex-col w-full bg-white shadow-md">
          <p className="font-bold">File</p>
          <div
            {...getRootProps()}
            className="border-dashed border-2 p-4 bg-gray-100"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
            )}
          </div>
          {fileName !== "" ? (
            <div className="flex justify-around">
              <p>{fileName} uploaded!</p>
              <img
                src={trash}
                className="cursor-pointer"
                onClick={() => {
                  setFileName("");
                  setCid("");
                }}
              />
            </div>
          ) : (
            <></>
          )}
        </div>

        {fileName !== "" ? (
          <div>
            <div className="mt-8 p-4 w-full bg-white shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col flex-grow">
                <label className="font-bold">Title</label>
                <input
                  className="p-4 bg-gray-100 mt-2"
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-grow">
                <label className="font-bold">Duration</label>
                <input
                  type={"number"}
                  className="p-4 bg-gray-100 mt-2"
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-grow">
                <label className="font-bold">Year</label>
                <input
                  type={"number"}
                  className="p-4 bg-gray-100 mt-2"
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-grow">
                <label className="font-bold">Description</label>
                <input
                  className="p-4 bg-gray-100 mt-2"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div>
              <h2 className="font-bold text-2xl mt-8 mb-2">Owners</h2>
              <div className="space-y-4">
                {members.map((member, i) => {
                  return (
                    <div
                      className="p-4 w-full bg-white shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4"
                      key={i}
                    >
                      <div className="flex flex-col flex-grow">
                        <label for={`member${i}`} className="font-bold">
                          Address
                        </label>
                        <input
                          id={`member${i}`}
                          className="p-4 bg-gray-100 mt-2"
                          onChange={(e) =>
                            setMembers((members) =>
                              members.map((member, memberIndex) =>
                                i === memberIndex ? e.target.value : member
                              )
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-col flex-grow">
                        <label for={`share${i}`} className="font-bold">
                          Shares
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          id={`share${i}`}
                          className="p-4 bg-gray-100 mt-2"
                          onChange={(e) =>
                            setShares((shares) =>
                              shares.map((share, shareIndex) =>
                                i === shareIndex ? e.target.value : share
                              )
                            )
                          }
                        />
                      </div>
                      <div className="flex justify-center col-start-2">
                        <img
                          id={`img${i}`}
                          src={trash}
                          className="cursor-pointer"
                          onClick={() => {
                            setMembers((members) =>
                              members.filter(
                                (member, memberIndex) => i !== memberIndex
                              )
                            );

                            setShares((shares) =>
                              shares.filter(
                                (share, shareIndex) => i !== shareIndex
                              )
                            );
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="border-dashed border-2 border-gray-400 p-4 w-full mt-4"
                onClick={() => {
                  setMembers((members) => [...members, ""]);
                  setShares((shares) => [...shares, ""]);
                }}
              >
                + Add owner
              </button>
            </div>

            <div>
              <h2 className="font-bold text-2xl mt-8 mb-2">Lyricists</h2>
              <div className="space-y-4">
                {lyricistsLastName.map((lyricist, i) => {
                  return (
                    <div
                      className="p-4 w-full bg-white shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4"
                      key={i}
                    >
                      <div className="flex flex-col flex-grow">
                        <label
                          for={`lyricists_last_name_${i}`}
                          className="font-bold"
                        >
                          Last Name
                        </label>
                        <input
                          id={`lyricists_last_name_input_${i}`}
                          className="p-4 bg-gray-100 mt-2"
                          onChange={(e) =>
                            setLyricistsLastName((lyricistsLastName) =>
                              lyricistsLastName.map(
                                (lyricistLastName, lyricistIndex) =>
                                  i === lyricistIndex
                                    ? e.target.value
                                    : lyricistLastName
                              )
                            )
                          }
                        />
                      </div>

                      <div className="flex flex-col flex-grow">
                        <label
                          for={`lyricists_first_name_${i}`}
                          className="font-bold"
                        >
                          First name
                        </label>
                        <input
                          id={`lyricists_first_name_input_${i}`}
                          className="p-4 bg-gray-100 mt-2"
                          onChange={(e) =>
                            setLyricistsFirstName((lyricistsFirstName) =>
                              lyricistsFirstName.map(
                                (lyricistFirstName, lyricistIndex) =>
                                  i === lyricistIndex
                                    ? e.target.value
                                    : lyricistFirstName
                              )
                            )
                          }
                        />
                      </div>
                      <div className="flex justify-center col-start-2">
                        <img
                          src={trash}
                          className="cursor-pointer"
                          onClick={() => {
                            setLyricistsLastName((lyricistsLastName) =>
                              lyricistsLastName.filter(
                                (lyricistLastName, lyricistIndex) =>
                                  i !== lyricistIndex
                              )
                            );
                            setLyricistsFirstName((lyricistsFirstName) =>
                              lyricistsFirstName.filter(
                                (lyricistFirstName, lyricistIndex) =>
                                  i !== lyricistIndex
                              )
                            );
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="border-dashed border-2 border-gray-400 p-4 w-full mt-4"
                onClick={() => {
                  setLyricistsLastName((lyricistsLastName) => [
                    ...lyricistsLastName,
                    "",
                  ]);
                  setLyricistsFirstName((lyricistsFirstNames) => [
                    ...lyricistsFirstNames,
                    "",
                  ]);
                }}
              >
                + Add lyricist
              </button>
            </div>
            <div>
              <h2 className="font-bold text-2xl mt-8 mb-2">Tags</h2>
              <div className="space-y-4">
                {tags.map((tag, i) => {
                  return (
                    <div
                      className="p-4 w-full bg-white shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4"
                      key={i}
                    >
                      <div className="flex flex-col flex-grow">
                        <label for={`tag${i}`} className="font-bold">
                          Tag
                        </label>
                        <input
                          id={`tag${i}`}
                          className="p-4 bg-gray-100 mt-2"
                          onChange={(e) =>
                            setTags((tags) =>
                              tags.map((tag, tagIndex) =>
                                i === tagIndex ? e.target.value : tag
                              )
                            )
                          }
                        />
                      </div>
                      <div className="flex justify-center">
                        <img
                          src={trash}
                          className="cursor-pointer"
                          onClick={() => {
                            setTags((tags) =>
                              tags.filter((tag, tagIndex) => i !== tagIndex)
                            );
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="border-dashed border-2 border-gray-400 p-4 w-full mt-4"
                onClick={() => {
                  setTags((tags) => [...tags, ""]);
                }}
              >
                + Add tag
              </button>
            </div>
          </div>
        ) : (
          <></>
        )}

        {members.length > 0 && fileName !== "" ? (
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 mt-4">
            <button
              className="p-4 bg-purple-700 text-white disabled:opacity-50"
              onClick={() => deployMultiSig()}
              disabled={
                members.filter((member) => member === "").length !== 0 ||
                shares.filter((share) => share === "").length !== 0 ||
                fileName === ""
              }
            >
              Deploy multisig
            </button>
            <button
              className="p-4 bg-purple-700 text-white disabled:opacity-50"
              onClick={() => signTx()}
              disabled={safeContractInstance == null}
            >
              Sign multisig
            </button>
            <button
              className="p-4 bg-purple-700 text-white disabled:opacity-50"
              onClick={() => confirmTx()}
              disabled={safeContractInstance == null}
            >
              Confirm deposit
            </button>
          </div>
        ) : (
          <></>
        )}
      </Layout>
    </>
  );
}
