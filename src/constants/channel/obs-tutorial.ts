// 방송 연결 페이지의 OBS 연결 가이드 단계 상수를 정의합니다.
import type { TutorialStep } from "@/components/common/tutorial-dialog";

// 채팅창·후원 알림 가이드가 함께 쓰는 브라우저 소스 공통 단계 이미지.
const OBS_OVERLAY_ADD_SOURCE_IMAGE = "/tutorial/obs-overlay-add-source.png";
const OBS_OVERLAY_CREATE_SOURCE_IMAGE = "/tutorial/obs-overlay-create-source.png";
const OBS_OVERLAY_PROPERTIES_IMAGE = "/tutorial/obs-overlay-properties.png";
const OBS_OVERLAY_POSITION_IMAGE = "/tutorial/obs-overlay-position.png";

export const OBS_CONNECT_TUTORIAL_TITLE = "OBS 방송 연결 가이드";

export const OBS_CONNECT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "OBS 설정 열기",
    description: "OBS Studio 프로그램을 실행했다면 설정을 클릭해 들어가주세요.",
    imageSrc: "/tutorial/obs-connect-1.png",
  },
  {
    title: "방송 탭에서 서버와 스트림 키 입력",
    description: `설정 메뉴에서 방송을 선택해주신 후에 서비스는 사용자 지정을 선택해줍니다.\n그 이후에 서버와 스트림 키에 알맞은 값을 복사해서 넣어주세요.`,
    imageSrc: "/tutorial/obs-connect-2.png",
  },
  {
    title: "값은 이 페이지에서 복사해요",
    description: `서버 주소와 스트림 키는 이 페이지의 방송 연결 정보에서 복사할 수 있어요.\n모두 붙여 넣었다면 OBS에서 방송 시작을 누르면 끝이에요!`,
    imageSrc: "/tutorial/obs-connect-3.png",
  },
];

export const OBS_CHAT_OVERLAY_TUTORIAL_TITLE = "OBS 채팅창 연결 가이드";

export const OBS_CHAT_OVERLAY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "브라우저 소스 추가",
    description: "OBS 하단 소스 목록에서 + 버튼을 누른 뒤 브라우저를 선택해주세요.",
    imageSrc: OBS_OVERLAY_ADD_SOURCE_IMAGE,
  },
  {
    title: "소스 이름 정하기",
    description: `새로 만들기를 선택하고 채팅창처럼 알아보기 쉬운 이름을 적어줍니다.\n다 적었다면 확인을 눌러주세요.`,
    imageSrc: OBS_OVERLAY_CREATE_SOURCE_IMAGE,
  },
  {
    title: "속성 창에서 주소와 크기 입력",
    description: `속성 창의 URL에 채팅창 주소를 붙여 넣어주세요.\n너비는 520, 높이는 600으로 맞추면 안정적으로 보여요.`,
    imageSrc: OBS_OVERLAY_PROPERTIES_IMAGE,
  },
  {
    title: "주소는 이 페이지에서 복사해요",
    description: `채팅창 주소는 이 페이지의 채팅창 주소에서 복사할 수 있어요.\n미리보기를 누르면 채팅창이 어떻게 보일지 미리 확인할 수도 있어요.`,
    imageSrc: "/tutorial/obs-chat-copy.png",
  },
  {
    title: "위치를 잡으면 끝이에요",
    description: `추가된 채팅창을 방송 화면에서 원하는 위치로 옮기고 크기를 조절해주세요.\n채팅이 멈춘 것처럼 보이면 새로고침 버튼을 누르면 돼요.`,
    imageSrc: OBS_OVERLAY_POSITION_IMAGE,
  },
];

export const OBS_DONATION_OVERLAY_TUTORIAL_TITLE = "OBS 후원 알림 연결 가이드";

export const OBS_DONATION_OVERLAY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "브라우저 소스 추가",
    description: "OBS 하단 소스 목록에서 + 버튼을 누른 뒤 브라우저를 선택해주세요.",
    imageSrc: OBS_OVERLAY_ADD_SOURCE_IMAGE,
  },
  {
    title: "소스 이름 정하기",
    description: `새로 만들기를 선택하고 후원 알림처럼 알아보기 쉬운 이름을 적어줍니다.\n다 적었다면 확인을 눌러주세요.`,
    imageSrc: OBS_OVERLAY_CREATE_SOURCE_IMAGE,
  },
  {
    title: "속성 창에서 주소와 크기 입력",
    description: `속성 창의 URL에 후원 알림 주소를 붙여 넣어주세요.\n크기는 640 x 360으로 두면 16:9 화면에 잘 맞아요.`,
    imageSrc: OBS_OVERLAY_PROPERTIES_IMAGE,
  },
  {
    title: "알림 소리가 방송에 나가게 설정해요",
    description: `같은 속성 창에서 "OBS를 통해 오디오 제어"를 꼭 체크해주세요.\n체크하면 효과음과 TTS가 OBS 오디오 믹서로 직접 들어가서, 화면 캡처 방식과 상관없이 방송에 실려요.\n테스트 후원을 보냈을 때 오디오 믹서의 볼륨 미터가 움직이면 정상이에요.\n소리가 본인에게 안 들리면 믹서의 톱니바퀴 → 오디오 고급 속성에서 해당 소스를 "모니터링 및 출력"으로 바꿔주세요.`,
    imageSrc: OBS_OVERLAY_PROPERTIES_IMAGE,
  },
  {
    title: "주소는 이 페이지에서 복사해요",
    description: `후원 알림 주소는 이 페이지의 후원 알림 주소에서 복사할 수 있어요.\n방송 중이 아니어도 후원 설정 페이지에서 테스트 후원을 보내 OBS 소스를 확인할 수 있어요.`,
    imageSrc: "/tutorial/obs-donation-copy.png",
  },
  {
    title: "위치를 잡으면 끝이에요",
    description: `추가된 후원 알림을 방송 화면에서 원하는 위치로 옮기고 크기를 조절해주세요.\n테스트 후원과 실제 후원 모두 설정한 표시 시간만큼 보여요.`,
    imageSrc: OBS_OVERLAY_POSITION_IMAGE,
  },
];
