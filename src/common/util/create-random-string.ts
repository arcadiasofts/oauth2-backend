/**
 * 랜덤한 문자열을 생성합니다.
 * @param length 문자열의 길이를 입력받습니다. 미입력 시 최대 20글자인 랜덤 길이의 문자열을 생성합니다.
 * @returns 완성된 문자열을 리턴합니다.
 */
export function createRandomString(length?: number) {
  if (!length) length = Math.floor(Math.random() * 20);
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  return Array.from({ length: length }, () => {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    return characters[randomIndex];
  }).join('');
}
