import { startSession } from "mongoose";
import { saveGallery as saveGalleryFromDB, findGalleryByID, updateGalleryView } from "../model/galleryModel.js";
import {
  findUserByID,
  findHistoryByID,
  updateUserHistory,
  findLastGalleryIDByID,
  findShareStatusByID,
  updateShareStateByID,
} from "../model/userModel.js";
import { processDataFromRawContent, processDataForClient } from "./dataProcessService.js";
import { getImagePixelsFromPages } from "./imageProcessService.js";
import { createConnectionSSE, endConnectionSSE, writeMessageSSE } from "./sseService.js";
import { getRawContentsFromNotion } from "./getNotionContentService.js";
import hash from "../utils/hash.js";
import { BadRequestError, NotFoundError, InternalServerError } from "../utils/httpError.js";
//DB에서 데이터를 불러오는 로직

function validateGalleryID(galleryID) {
  if (typeof galleryID !== "string" || galleryID.length !== 24) {
    return false;
  }
  return true;
}
export async function loadUserHistory(userID) {
  return findHistoryByID(userID);
}

export async function saveGallery(userID, galleryData) {
  //transaction
  const session = await startSession();
  try {
    session.startTransaction();
    const galleryID = await saveGalleryFromDB(galleryData, session);
    await updateUserHistory(userID, galleryID, session);
    await session.commitTransaction();
    session.endSession();
    return galleryID;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.log(err);
    throw new InternalServerError("DB 저장 실패");
  }
  // const id = await saveGalleryFromDB(userID, galleryData);
  // if (id === null) throw new InternalServerError("DB 저장 실패");
  // console.log("db저장 완료");
  // return id;
}

export async function loadGallery(requestUserData, userID, galleryID = null) {
  if (galleryID === null) galleryID = await getLastGalleryID(userID);
  if (!validateGalleryID(galleryID)) throw new BadRequestError("올바른 갤러리 ID가 아닙니다!");
  const { ipaddr, requestUserID } = requestUserData;

  const user = await findUserByID(userID);
  if (!user) throw NotFoundError("존재하지 않는 사용자입니다.");

  const { history } = user;
  if (!history.has(galleryID)) throw new NotFoundError("갤러리를 찾을 수 없습니다!");

  const galleryData = await findGalleryByID(galleryID);
  if (galleryData === null) throw new NotFoundError("갤러리를 찾을 수 없습니다!");

  console.log({ id: userID, requestUserID });
  IncreaseViewCount(ipaddr, galleryData);

  return processDataForClient(galleryData);
  // const result = await loadGalleryFromDB(requestUserData, userID, galleryID);
  // if (result.success) return processDataForClient(result.data);
  // if (result.err === "bad_request") throw new BadRequestError("갤러리를 찾을 수 없습니다!");
  // throw new NotFoundError(result.err);
}

async function IncreaseViewCount(ipaddr, galleryData) {
  const { views, viewers } = galleryData;
  const now = new Date().toLocaleDateString();
  const iphash = hash(ipaddr);
  const viewed = viewers.get(iphash) === now;

  if (iphash && (!viewed || ipaddr === "development")) {
    viewers.set(iphash, now);
    const session = await startSession();
    try {
      session.startTransaction();
      await updateGalleryView(galleryData._id, viewers, views, session);
      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.log(err);
      throw new InternalServerError("DB 저장 실패");
    }
  }
}


export async function getLastGalleryID(userID) {
  const galleryID = await findLastGalleryID(userID);
  if (galleryID === null) throw new NotFoundError("갤러리를 찾을 수 없습니다!");
  return galleryID;
}

export async function getGalleryHistory(userID) {
  const historyMap = await findHistoryByID(userID);
  return Object.fromEntries([...historyMap]);
}

export async function getUserGalleryStatus(userID) {
  const [lastGalleryID, isShared] = await Promise.all([getLastGalleryID(userID), findShareStatusByID(userID)]);

  return { isCreated: lastGalleryID !== null, isShared: isShared ?? false };
}

export async function createGallery(notionAccessToken, period, theme, userID, res) {
  createConnectionSSE(res);

  writeMessageSSE(JSON.stringify({ kind: "노션 데이터 불러오는 중...", progress: 25, data: {} }), res);
  const notionRawContent = await getRawContentsFromNotion(notionAccessToken, period);
  writeMessageSSE(JSON.stringify({ kind: "노션 데이터 불러오기 완료", progress: 50, data: {} }), res);

  writeMessageSSE(JSON.stringify({ kind: "이미지 가공 중...", progress: 55, data: {} }), res);
  const notionImageContent = await getImagePixelsFromPages(notionRawContent);
  writeMessageSSE(JSON.stringify({ kind: "이미지 가공 완료", progress: 60, data: {} }), res);

  writeMessageSSE(JSON.stringify({ kind: "키워드 추출 중...", progress: 65, data: {} }), res);
  const processedNotionContent = await processDataFromRawContent(notionImageContent, theme);
  writeMessageSSE(JSON.stringify({ kind: "키워드 추출 완료", progress: 70, data: {} }), res);

  writeMessageSSE(JSON.stringify({ kind: "DB에서 데이터 저장 중...", progress: 80, data: {} }), res);
  const galleryID = await saveGallery(userID, processedNotionContent);
  writeMessageSSE(JSON.stringify({ kind: "DB에서 데이터 저장 완료", progress: 85, data: {} }), res);

  return galleryID;
}
