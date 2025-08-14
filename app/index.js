import { View, ScrollView, StyleSheet, Text } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useRightSidebar } from "../contexts/SidebarContext";
import { useEffect } from "react";
import { useAppStorage } from "../contexts/AppStorageContext";
import PaginatedResults from "../components/ResultsCard";
import AccordionGroup from "../components/AccordionGroup";
import { isBulkResponse, normalizeSearchResponse } from "../lib/utils";
import { useSearch } from "../contexts/SearchContext";

export default function Home() {
  // songs = [
  //   {
  //     title: "KAKASHI HATAKE UK DRILL (NARUTO SHIPPUDEN RAP)",
  //     duration: 165,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/Uc1mlhTm53g/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=Uc1mlhTm53g",
  //     upload_date: "2025-07-26T17:00:07Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/Uc1mlhTm53g/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/Uc1mlhTm53g/default.jpg",
  //   },
  //   {
  //     title: "COD WARZONE UK DRILL",
  //     duration: 132,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/u_gGW4xvuRY/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=u_gGW4xvuRY",
  //     upload_date: "2025-08-08T17:00:07Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/u_gGW4xvuRY/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/u_gGW4xvuRY/default.jpg",
  //   },
  //   {
  //     title: "SASUKE UCHIHA UK DRILL (NARUTO SHIPPUDEN RAP)",
  //     duration: 130,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/b0E2gYayV94/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=b0E2gYayV94",
  //     upload_date: "2025-06-27T18:30:07Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/b0E2gYayV94/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/b0E2gYayV94/default.jpg",
  //   },
  //   {
  //     title: "SUKUNA RAP (King Of The Curses) Jujutsu Kaisen UK Drill",
  //     duration: 152,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/greCfsxFvuE/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=greCfsxFvuE",
  //     upload_date: "2023-12-22T18:00:11Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/greCfsxFvuE/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/greCfsxFvuE/default.jpg",
  //   },
  //   {
  //     title:
  //       "Minato UK Drill Ft @ShaoDowMusic (Obito and 3rd Hokage Diss) (Naruto Rap)",
  //     duration: 132,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/oPGINKkQqS8/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=oPGINKkQqS8",
  //     upload_date: "2025-02-08T18:00:06Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/oPGINKkQqS8/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/oPGINKkQqS8/default.jpg",
  //   },
  //   {
  //     title:
  //       "Gear 5 Luffy UK Drill (One Piece) Kaido Diss &#39;&#39;Drums Of Liberation&#39;&#39;",
  //     duration: 134,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/A439AEWTJd8/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=A439AEWTJd8",
  //     upload_date: "2023-09-24T15:00:09Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/A439AEWTJd8/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/A439AEWTJd8/default.jpg",
  //   },
  //   {
  //     title:
  //       "Itadori Yuji Rap - Sukuna and Mahito Diss (Jujutsu Kaisen UK Drill) (Prod by A Class)",
  //     duration: 138,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/LueTJIMow68/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=LueTJIMow68",
  //     upload_date: "2024-02-06T17:00:11Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/LueTJIMow68/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/LueTJIMow68/default.jpg",
  //   },
  //   {
  //     title: "Madara Uk Drill Freestyle (Everyone Diss) (Naruto Shippuden Rap)",
  //     duration: 119,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/R1TEEEi4_nk/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=R1TEEEi4_nk",
  //     upload_date: "2025-01-06T18:00:06Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/R1TEEEi4_nk/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/R1TEEEi4_nk/default.jpg",
  //   },
  //   {
  //     title: "SUNG JIN WOO (Solo Leveling UK Drill)",
  //     duration: 162,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/Vj8QX3TICKQ/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=Vj8QX3TICKQ",
  //     upload_date: "2025-02-13T19:00:06Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/Vj8QX3TICKQ/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/Vj8QX3TICKQ/default.jpg",
  //   },
  //   {
  //     title: "AIZEN SOSUKE (BLEACH UK DRILL) YWACH DISS",
  //     duration: 172,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/RlHwOlFThwo/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=RlHwOlFThwo",
  //     upload_date: "2025-06-13T18:30:06Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/RlHwOlFThwo/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/RlHwOlFThwo/default.jpg",
  //   },
  //   {
  //     title:
  //       "Gojo UK Drill (Jujutsu Kaisen) &quot;The one who left his child behind&quot; and Sukuna Diss  @MusicalityMusic",
  //     duration: 168,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/gWBE7DL5XSE/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=gWBE7DL5XSE",
  //     upload_date: "2024-10-27T18:00:06Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/gWBE7DL5XSE/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/gWBE7DL5XSE/default.jpg",
  //   },
  //   {
  //     title: "Escanor UK Drill (The One)  (Seven Deadly Sins)",
  //     duration: 138,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/-5YghqpgX6w/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=-5YghqpgX6w",
  //     upload_date: "2024-06-21T15:30:07Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/-5YghqpgX6w/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/-5YghqpgX6w/default.jpg",
  //   },
  //   {
  //     title:
  //       "Muzan Uk Drill (Demon Slayer) [Ubuyashiki Response Diss] @prodbyaclass",
  //     duration: 160,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/jthgLSD8N8I/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=jthgLSD8N8I",
  //     upload_date: "2024-08-16T16:00:06Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/jthgLSD8N8I/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/jthgLSD8N8I/default.jpg",
  //   },
  //   {
  //     title: "Madara UK Drill (Naruto Shippuden Rap) (Everyone Diss)",
  //     duration: 118,
  //     uploader: "Pureojuice - Topic",
  //     thumbnail: "https://i.ytimg.com/vi/qI64tPXWynQ/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=qI64tPXWynQ",
  //     upload_date: "2025-01-05T22:21:52Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/qI64tPXWynQ/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/qI64tPXWynQ/default.jpg",
  //   },
  //   {
  //     title:
  //       "Making of THCa Diamonds 💎 🤯  #thcadiamonds #cannabisextraction #extractionequipment",
  //     duration: 15,
  //     uploader: "Evolved Extraction Solutions",
  //     thumbnail: "https://i.ytimg.com/vi/UQhOwF0fl-c/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=UQhOwF0fl-c",
  //     upload_date: "2023-08-15T18:55:47Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/UQhOwF0fl-c/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/UQhOwF0fl-c/default.jpg",
  //   },
  //   {
  //     title: "How to make cannabis oil or RSO 3 parts total part 3",
  //     duration: 14,
  //     uploader: "Cherry Darling",
  //     thumbnail: "https://i.ytimg.com/vi/P6ZpptMNTOQ/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=P6ZpptMNTOQ",
  //     upload_date: "2019-07-05T20:56:51Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/P6ZpptMNTOQ/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/P6ZpptMNTOQ/default.jpg",
  //   },
  //   {
  //     title: "Who Let Anime Characters Rap Like THIS?? 🤯",
  //     duration: 604,
  //     uploader: "More TrueGawd",
  //     thumbnail: "https://i.ytimg.com/vi/5DyTxYqjE-c/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=5DyTxYqjE-c",
  //     upload_date: "2025-03-17T01:48:19Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/5DyTxYqjE-c/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/5DyTxYqjE-c/default.jpg",
  //   },
  //   {
  //     title: "Pure O Juice - SASUKE UCHIHA UK DRILL | Reaction!",
  //     duration: 566,
  //     uploader: "WHAT IT DO DAVE",
  //     thumbnail: "https://i.ytimg.com/vi/kwQXMk1-3Lo/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=kwQXMk1-3Lo",
  //     upload_date: "2025-06-28T17:00:53Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/kwQXMk1-3Lo/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/kwQXMk1-3Lo/default.jpg",
  //   },
  //   {
  //     title: "@PureOJuice Is GOATED Gear 5 Luffy UK Drill Reaction #onepiece",
  //     duration: 218,
  //     uploader: "Bakesensei",
  //     thumbnail: "https://i.ytimg.com/vi/WJQps6GY_Zk/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=WJQps6GY_Zk",
  //     upload_date: "2023-09-25T19:00:24Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/WJQps6GY_Zk/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/WJQps6GY_Zk/default.jpg",
  //   },
  //   {
  //     title: "MINATO UK DRILL SNIPPET",
  //     duration: 20,
  //     uploader: "Pure O Juice",
  //     thumbnail: "https://i.ytimg.com/vi/8dAkpxbnqIc/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=8dAkpxbnqIc",
  //     upload_date: "2025-01-28T15:35:00Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/8dAkpxbnqIc/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/8dAkpxbnqIc/default.jpg",
  //   },
  //   {
  //     title: "Pure O Juice - KAKASHI HATAKE UK DRILL | Reaction!",
  //     duration: 495,
  //     uploader: "WHAT IT DO DAVE",
  //     thumbnail: "https://i.ytimg.com/vi/_AbrUqujsqs/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=_AbrUqujsqs",
  //     upload_date: "2025-07-27T15:01:01Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/_AbrUqujsqs/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/_AbrUqujsqs/default.jpg",
  //   },
  //   {
  //     title: "Yakult Drink Popsicle #shorts",
  //     duration: 13,
  //     uploader: "Weee! ",
  //     thumbnail: "https://i.ytimg.com/vi/DguBOWHDcBU/hqdefault.jpg",
  //     webpage_url: "https://www.youtube.com/watch?v=DguBOWHDcBU",
  //     upload_date: "2021-07-09T23:21:32Z",
  //     largest_thumbnail: "https://i.ytimg.com/vi/DguBOWHDcBU/hqdefault.jpg",
  //     smallest_thumbnail: "https://i.ytimg.com/vi/DguBOWHDcBU/default.jpg",
  //   },
  // ];

  // songs = [
  //   [
  //     {
  //       search_term: {
  //         type: "search",
  //         query: "rustage",
  //       },
  //       results: [
  //         {
  //           title:
  //             "SUPERMAN RAP  | &quot;HOPE&quot; | RUSTAGE ft. JT MUSIC &amp; LongestSoloEver",
  //           duration: 215,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/ayA_GJV93gA/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=ayA_GJV93gA",
  //           upload_date: "2025-08-09T00:35:00Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/ayA_GJV93gA/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/ayA_GJV93gA/default.jpg",
  //         },
  //         {
  //           title:
  //             "LEADERS OF HISTORY RAP CYPHER | RUSTAGE ft. The Stupendium, Keyblade, TOPHAMHAT-KYO &amp; More",
  //           duration: 643,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=PEwy4U1OkBA",
  //           upload_date: "2025-06-21T23:45:01Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/PEwy4U1OkBA/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/PEwy4U1OkBA/default.jpg",
  //         },
  //         {
  //           title:
  //             "TENNA RAP | &quot;ALL OR NOTHING&quot; | RUSTAGE ft. McGwire [DELTARUNE]",
  //           duration: 176,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/BVHEPeKMQRI/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=BVHEPeKMQRI",
  //           upload_date: "2025-07-26T16:10:00Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/BVHEPeKMQRI/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/BVHEPeKMQRI/default.jpg",
  //         },
  //         {
  //           title:
  //             "CID KAGENOU RAP | &quot;ATOMIC&quot; | RUSTAGE ft. TSUYO [THE EMINENCE IN SHADOW]",
  //           duration: 172,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/i6urQLIEWBE/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=i6urQLIEWBE",
  //           upload_date: "2025-07-04T21:01:00Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/i6urQLIEWBE/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/i6urQLIEWBE/default.jpg",
  //         },
  //         {
  //           title:
  //             "CONQUEST RAP | &quot;MY NAME&quot; | RUSTAGE ft. Isaa Corva [INVINCIBLE]",
  //           duration: 191,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/_xxElXDUFdk/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=_xxElXDUFdk",
  //           upload_date: "2025-05-16T21:00:46Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/_xxElXDUFdk/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/_xxElXDUFdk/default.jpg",
  //         },
  //         {
  //           title:
  //             "YONKO RAP CYPHER | RUSTAGE ft. Shwabadi, Connor Quest! PE$O PETE &amp; Lex Bratcher [ONE PIECE]",
  //           duration: 248,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/8tCMJOYvpi4/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=8tCMJOYvpi4",
  //           upload_date: "2021-06-11T21:00:05Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/8tCMJOYvpi4/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/8tCMJOYvpi4/default.jpg",
  //         },
  //         {
  //           title:
  //             "GOJO RAP | &quot;Running in Blind&quot; | RUSTAGE ft. McGwire [JJK]",
  //           duration: 208,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/AqKm5HFWAZw/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=AqKm5HFWAZw",
  //           upload_date: "2021-07-02T21:00:04Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/AqKm5HFWAZw/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/AqKm5HFWAZw/default.jpg",
  //         },
  //         {
  //           title:
  //             "ALUCARD RAP | &quot;Blood&quot; | RUSTAGE ft. TOPHAMHAT-KYO [HELLSING]",
  //           duration: 216,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/RFBDmwFxVr0/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=RFBDmwFxVr0",
  //           upload_date: "2021-06-18T21:00:08Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/RFBDmwFxVr0/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/RFBDmwFxVr0/default.jpg",
  //         },
  //         {
  //           title:
  //             "GEAR 5 LUFFY RAP | &quot;The Drums of Liberation&quot; | RUSTAGE ft. The Stupendium &amp; PE$O PETE [One Piece]",
  //           duration: 215,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/bnATUKzt54o/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=bnATUKzt54o",
  //           upload_date: "2023-08-18T21:15:01Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/bnATUKzt54o/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/bnATUKzt54o/default.jpg",
  //         },
  //         {
  //           title:
  //             "BERU RAP | &quot;BOW DOWN&quot; | RUSTAGE ft. Thrizzy [Solo Leveling]",
  //           duration: 194,
  //           uploader: "RUSTAGE",
  //           thumbnail: "https://i.ytimg.com/vi/2VX5WVaW8Bc/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=2VX5WVaW8Bc",
  //           upload_date: "2025-05-30T21:00:02Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/2VX5WVaW8Bc/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/2VX5WVaW8Bc/default.jpg",
  //         },
  //       ],
  //       count: 10,
  //     },
  //     {
  //       search_term: {
  //         type: "search",
  //         query: "pure o juice",
  //       },
  //       results: [
  //         {
  //           title: "COD WARZONE UK DRILL",
  //           duration: 132,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/u_gGW4xvuRY/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=u_gGW4xvuRY",
  //           upload_date: "2025-08-08T17:00:07Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/u_gGW4xvuRY/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/u_gGW4xvuRY/default.jpg",
  //         },
  //         {
  //           title: "KAKASHI HATAKE UK DRILL (NARUTO SHIPPUDEN RAP)",
  //           duration: 165,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/Uc1mlhTm53g/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=Uc1mlhTm53g",
  //           upload_date: "2025-07-26T17:00:07Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/Uc1mlhTm53g/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/Uc1mlhTm53g/default.jpg",
  //         },
  //         {
  //           title: "SASUKE UCHIHA UK DRILL (NARUTO SHIPPUDEN RAP)",
  //           duration: 130,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/b0E2gYayV94/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=b0E2gYayV94",
  //           upload_date: "2025-06-27T18:30:07Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/b0E2gYayV94/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/b0E2gYayV94/default.jpg",
  //         },
  //         {
  //           title:
  //             "Minato UK Drill Ft @ShaoDowMusic (Obito and 3rd Hokage Diss) (Naruto Rap)",
  //           duration: 132,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/oPGINKkQqS8/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=oPGINKkQqS8",
  //           upload_date: "2025-02-08T18:00:06Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/oPGINKkQqS8/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/oPGINKkQqS8/default.jpg",
  //         },
  //         {
  //           title:
  //             "Gear 5 Luffy UK Drill (One Piece) Kaido Diss &#39;&#39;Drums Of Liberation&#39;&#39;",
  //           duration: 134,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/A439AEWTJd8/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=A439AEWTJd8",
  //           upload_date: "2023-09-24T15:00:09Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/A439AEWTJd8/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/A439AEWTJd8/default.jpg",
  //         },
  //         {
  //           title: "SUKUNA RAP (King Of The Curses) Jujutsu Kaisen UK Drill",
  //           duration: 152,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/greCfsxFvuE/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=greCfsxFvuE",
  //           upload_date: "2023-12-22T18:00:11Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/greCfsxFvuE/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/greCfsxFvuE/default.jpg",
  //         },
  //         {
  //           title:
  //             "Itadori Yuji Rap - Sukuna and Mahito Diss (Jujutsu Kaisen UK Drill) (Prod by A Class)",
  //           duration: 138,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/LueTJIMow68/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=LueTJIMow68",
  //           upload_date: "2024-02-06T17:00:11Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/LueTJIMow68/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/LueTJIMow68/default.jpg",
  //         },
  //         {
  //           title:
  //             "Madara Uk Drill Freestyle (Everyone Diss) (Naruto Shippuden Rap)",
  //           duration: 119,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/R1TEEEi4_nk/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=R1TEEEi4_nk",
  //           upload_date: "2025-01-06T18:00:06Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/R1TEEEi4_nk/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/R1TEEEi4_nk/default.jpg",
  //         },
  //         {
  //           title:
  //             "Gojo UK Drill (Jujutsu Kaisen) &quot;The one who left his child behind&quot; and Sukuna Diss  @MusicalityMusic",
  //           duration: 168,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/gWBE7DL5XSE/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=gWBE7DL5XSE",
  //           upload_date: "2024-10-27T18:00:06Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/gWBE7DL5XSE/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/gWBE7DL5XSE/default.jpg",
  //         },
  //         {
  //           title:
  //             "Toji Uk Drill (Jujutsu Kaisen Rap) Gojo &quot;The Humbled One&quot; Diss @MusicalityMusic",
  //           duration: 155,
  //           uploader: "Pure O Juice",
  //           thumbnail: "https://i.ytimg.com/vi/VWTxGaaZgXE/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=VWTxGaaZgXE",
  //           upload_date: "2023-08-08T14:00:11Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/VWTxGaaZgXE/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/VWTxGaaZgXE/default.jpg",
  //         },
  //       ],
  //       count: 10,
  //     },
  //     {
  //       search_term: {
  //         type: "search",
  //         query: "drizzy8",
  //       },
  //       results: [
  //         {
  //           title:
  //             "DABI INSPIRED RAP SONG | &quot;SAVE ME&quot; | DizzyEight x Errol Allen x Musicality [MY HERO ACADEMIA AMV]",
  //           duration: 218,
  //           uploader: "DizzyEight",
  //           thumbnail: "https://i.ytimg.com/vi/o7lOyH_iPbs/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=o7lOyH_iPbs",
  //           upload_date: "2024-10-06T16:00:46Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/o7lOyH_iPbs/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/o7lOyH_iPbs/default.jpg",
  //         },
  //         {
  //           title:
  //             "GETO &amp; GOJO RAP SONG | &quot;SPECIAL GRADE DUO&quot; (Toji Diss) | DizzyEight X Khantrast [Jujutsu Kaisen AMV]",
  //           duration: 156,
  //           uploader: "DizzyEight",
  //           thumbnail: "https://i.ytimg.com/vi/1H4minmxZQM/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=1H4minmxZQM",
  //           upload_date: "2023-09-02T17:00:01Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/1H4minmxZQM/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/1H4minmxZQM/default.jpg",
  //         },
  //         {
  //           title:
  //             "GEAR 5 LUFFY RAP SONG | &quot;Liberation&quot; | DizzyEight ft. Errol Allen [One Piece AMV]",
  //           duration: 209,
  //           uploader: "DizzyEight",
  //           thumbnail: "https://i.ytimg.com/vi/6arfGkA-EUA/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=6arfGkA-EUA",
  //           upload_date: "2023-08-19T17:00:09Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/6arfGkA-EUA/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/6arfGkA-EUA/default.jpg",
  //         },
  //         {
  //           title:
  //             "NARUTO &amp; SASUKE RAP SONG | &quot;Hokage&quot; | DizzyEight ft. SL!CK [Naruto AMV] (Prod. By Llouis)",
  //           duration: 178,
  //           uploader: "DizzyEight",
  //           thumbnail: "https://i.ytimg.com/vi/OZ24cnOosjU/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=OZ24cnOosjU",
  //           upload_date: "2022-01-01T17:59:59Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/OZ24cnOosjU/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/OZ24cnOosjU/default.jpg",
  //         },
  //         {
  //           title:
  //             "FRIEZA RAP SONG | &quot;Feeling Like&quot; | Mix Williams ft. DizzyEight [Dragon Ball Super]",
  //           duration: 219,
  //           uploader: "DizzyEight",
  //           thumbnail: "https://i.ytimg.com/vi/ozO_GW_g-50/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=ozO_GW_g-50",
  //           upload_date: "2021-03-27T17:00:14Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/ozO_GW_g-50/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/ozO_GW_g-50/default.jpg",
  //         },
  //         {
  //           title: "Drizzy 8",
  //           duration: 126,
  //           uploader: "DrizzytheDogTV",
  //           thumbnail: "https://i.ytimg.com/vi/Us5BCOSCGUM/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=Us5BCOSCGUM",
  //           upload_date: "2010-08-10T11:34:03Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/Us5BCOSCGUM/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/Us5BCOSCGUM/default.jpg",
  //         },
  //         {
  //           title: "Drizzy 8 #funnyshorts #klingai#memes #klingelements",
  //           duration: 42,
  //           uploader: "radiorashim69",
  //           thumbnail: "https://i.ytimg.com/vi/ekMUduQkuXE/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=ekMUduQkuXE",
  //           upload_date: "2025-01-16T23:37:21Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/ekMUduQkuXE/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/ekMUduQkuXE/default.jpg",
  //         },
  //         {
  //           title: "Drizzy&#39;s 8 Ball Pool Assistant",
  //           duration: 61,
  //           uploader: "jdelacrixer",
  //           thumbnail: "https://i.ytimg.com/vi/X3JumckBHlg/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=X3JumckBHlg",
  //           upload_date: "2015-08-03T23:47:18Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/X3JumckBHlg/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/X3JumckBHlg/default.jpg",
  //         },
  //         {
  //           title:
  //             "VEGITO INSPIRED RAP SONG | &quot;New Level&quot; | DizzyEight x Errol Allen x Musicality [Dragon Ball Super]",
  //           duration: 211,
  //           uploader: "DizzyEight",
  //           thumbnail: "https://i.ytimg.com/vi/AXsheAA2joM/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=AXsheAA2joM",
  //           upload_date: "2024-11-17T18:00:11Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/AXsheAA2joM/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/AXsheAA2joM/default.jpg",
  //         },
  //         {
  //           title: "Metro Boomin - BBL DRIZZY",
  //           duration: 205,
  //           uploader: "Unique Vibes",
  //           thumbnail: "https://i.ytimg.com/vi/AF2MqFnPotc/hqdefault.jpg",
  //           webpage_url: "https://www.youtube.com/watch?v=AF2MqFnPotc",
  //           upload_date: "2024-05-06T23:38:29Z",
  //           largest_thumbnail:
  //             "https://i.ytimg.com/vi/AF2MqFnPotc/hqdefault.jpg",
  //           smallest_thumbnail:
  //             "https://i.ytimg.com/vi/AF2MqFnPotc/default.jpg",
  //         },
  //       ],
  //       count: 10,
  //     },
  //   ],
  // ];

  // const { type, items, blocks } = normalizeSearchResponse(songs);

  const { setRightSidebarKey } = useRightSidebar();
  const { viewMode } = useAppStorage();
  const {
    normalized,
    isLoading,
    error,
    getPageItems,
    page,
    totalPages,
    setPage,
  } = useSearch();

  if (isLoading && !normalized) return <Text>Loading skeleton...</Text>;
  if (error) return <Text style={{ color: "red" }}>{error}</Text>;
  if (!normalized) return <Text>Enter a query and press Enter</Text>;
  useEffect(() => {
    setRightSidebarKey("home");
    return () => setRightSidebarKey(null);
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container]}
      // contentContainerStyle={[styles.scrollContainer]}
    >
      <View>
        {/* <ScrollView style={{ padding: 16 }}> */}

        {normalized.type === "bulk" ? (
          normalized.blocks.map((block) => (
            <AccordionGroup
              key={block.search_term.query}
              block={block}
              pageSize={9}
              viewMode={viewMode}
            />
          ))
        ) : (
          <PaginatedResults
            style={styles.searchResults}
            songs={normalized.items}
            pageSize={12}
            viewMode={viewMode}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 200,
    width: "100%",
  },
  searchResults: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 20,
  },
  searchResultsGrid: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    width: "100%",
    gap: 20,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  thumbnailImage: {
    width: 150, // give the container a size
    height: 150,
    borderRadius: 8,
    overflow: "hidden", // important for rounded corners
  },
  thumbnailImageGrid: {
    width: 200, // give the container a size
    height: 150,
    borderRadius: 8,
    overflow: "hidden", // important for rounded corners
  },
  thumbnailImg: {
    width: "100%", // make image fill the container
    height: "100%",
  },
  resultCard: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 30,
    flexDirection: "row",
    padding: 10,
    borderRadius: 20,
    width: "80%",
  },
  resultCardGrid: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 20,
    width: "15em",
    height: "25em",
  },
  details: {
    height: 100,
    width: "70%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailsGrid: {
    height: 100,
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  titleDurationBox: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  titleDurationBoxGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  buttonsBox: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
  },
  buttonsBoxGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  buttonBox: {
    borderRadius: 7,
    width: "40%",
  },
  buttonBoxGrid: {
    borderRadius: 7,
    width: "100%",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "100%",
  },
});
