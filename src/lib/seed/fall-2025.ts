/**
 * The Fall 2025 Rye Brook activity brochure, rebuilt as editable blocks.
 *
 * This ships as the default template: duplicate it, change the dates and fees,
 * export. Transcribed from `2025-Fall-Brochure-2.pdf`.
 */

import type { Doc } from '../types';
import { DEFAULT_THEME } from '../theme';
import { newId } from '../doc';
import {
  CHECKS, CHECKS_MAKE, F, gap, hl, lv, page, photo, prog, qr, REG_CALLOUT,
  sec, table, tbl, txt,
} from './helpers';

const IMG = {
  fallPath:   '/seed/photo-fall-path.jpg',
  fallPond:   '/seed/photo-fall-pond.jpg',
  basketball: '/seed/photo-youth-basketball.jpg',
  hoop:       '/seed/photo-basketball-hoop.jpg',
  pumpkins:   '/seed/photo-pumpkins.jpg',
  pickleball: '/seed/photo-pickleball.jpg',
  moviePark:  '/seed/photo-movie-park.jpg',
  heart:      '/seed/photo-heart.jpg',
  tree:       '/seed/photo-holiday-tree.jpg',
  village:    '/seed/logo-village.png',
  piz:        '/seed/logo-pickleball.png',
};

const RATE = { cols: [3.0, 1.25, 0.8, 1.9] };

/** Rating-session tables share a shape across the whole basketball section. */
const ratingTable = (dates: string, time: string) =>
  tbl(['Rating Dates', 'Time', 'Fee', 'Location'], [[dates, time, '$175', 'RSS New Gym']], RATE);

// ---------------------------------------------------------------- page 1
const p1 = page(
  [{
    id: newId(), span: 'full', col: 0, background: { kind: 'none' }, typo: {}, padding: 0,
    type: 'cover',
    props: {
      kicker: 'Fall 2025 Activities Brochure',
      title: 'COME JOIN THE FUN!',
      subtitle: 'Rye Brook Parks & Recreation Department',
      photo: { url: IMG.fallPath, focal: 'center' },
      footer: [
        { text: 'ONLINE REGISTRATION BEGINS' },
        { text: 'September 3rd @ 9:30PM' },
        { text: '' },
        { text: 'www.ryebrookny.gov', scale: 1.5 },
      ],
      socialPrefix: 'Follow us at:',
      socials: [{ icon: 'x', handle: '@ryebrookrec' }, { icon: 'instagram', handle: '@ryebrookrec' }],
      bandFill: F('@cyan'),
      photoShare: 0.63,
    },
  }],
  { margin: 0, hideNumber: true },
);

// ---------------------------------------------------------------- page 2
const LETTER_ITALIC = { italic: true, align: 'justify' as const, size: 11.4, lineHeight: 1.03 };

const p2 = page(
  [
    {
      id: newId(), span: 'column', col: 0, background: F('@cyan'), typo: { size: 10.5 }, padding: 6,
      type: 'sidebarBox',
      props: {
        logo: IMG.village,
        title: 'Village of Rye Brook',
        padding: 0,
        groups: [
          { label: 'Mayor', items: ['Jason Klein'] },
          { label: 'Village Board', items: ['Susan Epstein', 'Donald Krom', 'David Heiser', 'Salvatore Morlino'] },
          { label: 'Village Administrator', items: ['Christopher Bradbury'] },
          { label: 'Parks and Recreation\nAdvisory Council', items: [
            'Chairperson - Judy Klein', 'Lisa Benoit', 'Nethra Bhatt', 'Nancy Matles',
            'John Mugno', 'Christie Mutis', 'MaryAnn Neilsen',
          ] },
          { label: 'Recreation Department', items: [
            'Robert Bertolacci - Superintendent', 'Benjamin Becker - Rec Supervisor',
            'Rose D’Ascoli - Sr. Office Assistant', 'Rocco Furano -  Recreation Assistamt',
          ] },
          { label: 'Parks Department', items: [
            'Paul Vinci - Foreman', 'Wladek Colantuono - Parks Attendant', 'Zack Warren - Parks Attendant',
          ] },
          { label: 'Emails', items: [
            'rbertolacci@ryebrookny.gov', 'bbecker@ryebrookny.gov', 'rfurano@ryebrookny.gov',
            'rdascoli@ryebrookny.gov', 'pvinci@ryebrookny.gov',
          ] },
        ],
      },
    },
    txt('<p>Dear Rye Brook Resident:</p>', {
      col: 1, typo: { size: 14, weight: 700, italic: true, color: '@cyan', spaceAfter: 6 },
    }),
    txt(
      `<p>I hope this brochure finds you well and looking forward to some recreation activities.  As the new school year is upon us, so is a new recreation season.</p>
<p>I would like to take this opportunity to invite you to experience Recreation’s wide ranging activities for all ages.  Popular Recreation programs include: Snapology, Youth Basketball, Men’s Basketball and many other activities to fit into your fall schedule.  This year, Rye Brook Recreation will be offering an <u>After School for Kids</u> program at Ridge St. School for all Ridge St. School students needing an extended day program. <strong>Special events for this fall are: <span style="color:#CC6600">Back to School Movie in the Park, Pumpkin Patch, Howloween, Trunk or Treat, and Pumpkin Smash.</span></strong>  Coming in December is the <u>Winterfest</u> event to commence the holiday season.</p>
<p><u>After School for Kids</u> is an after school program at Ridge Street School. The typical after school program times will be from dismissal (approx. 3:10pm) until 6:30pm (pickups can occur at any time in between) and the times will be extended when shorter school days are scheduled in advance.  As in the past, if your child is participating in a separate PTA or Recreation program at Ridge Street Elementary School during the after school program hours, Rye Brook Recreation staff will bring and return the children to these programs as well.   For those not registered in any other alternative programs, the children will be busy with a variety of recreational activities.</p>
<p>Rye Brook Recreation will be hosting a <u>Back to School Movie in the Park</u> at Pine Ridge Park on Friday  September 5th <strong>(rain date September 6th)</strong>.  We will be showing the movie <u>Snow White</u> which will begin at 7:30pm, where refreshments will be sold.  Come early and bring your blanket and outdoor seats to get a good viewing spot for the movie.  We hope to see all of you at this event to kick off the new school and recreation year.</p>
<p>October events will be as follows:  Our annual <u>Pumpkin Patch</u> event will take place on Saturday October 11th from 9am until Noon. The <u>Howloween</u> event for the dogs will take place on October 25th.  Dress your dog in their Halloween costume and come for this special event.  There will be presentations and a <u>Howloween</u> parade with prizes for the best costumes.  Following that event on October 29th  will be the Village’s third annual <u>Trunk and Treat</u> event.  Each Village department will decorate their vehicles for this event and we invite the residents in their Halloween costumes to receive treats from the staff.  At the conclusion of the event, residents will be able to vote for their favorite vehicle so “that department” will have bragging rights until next year’s event.</p>
<p>The <u>Rye Brook Tennis Courts</u> will remain open through Thanksgiving.  Reservations are required through Court Reserve. To reserve a court time, residents must possess a valid 2025 Court Reserve permit.</p>
<p>In memory of Paula Bertolacci, the 15th annual <u>“Paula’s Pals” Coat Drive</u> will take place from September 25th  to  December 5th to collect clean reusable coats for the needy.  These coats will be donated to the Don Bosco Center and Caritas in Port Chester where they will be distributed to our local needy neighbors.  Paula’s goal before passing in January 2011, was to donate 150 coats to the needy.  We hope to meet this goal again this year. Collection boxes will be located at the Rye Brook Recreation Department and the Anthony J. Posillipo Center.</p>
<p>Please note that <u>online registration</u> will begin on Wednesday, September 3rd at 9:30pm.</p>
<p>I look forward to seeing you at some of our programs and hope that Rye Brook Recreation is meeting your recreational needs.</p>
<p><strong>Robert Bertolacci<br>Parks &amp; Recreation Superintendent</strong></p>`,
      { col: 1, typo: LETTER_ITALIC },
    ),
  ],
  { colRatio: [0.31, 0.69], margin: 0.22 },
);

// ---------------------------------------------------------------- page 3
const PARK_HEAD = { size: 13, weight: 700 as const, color: '@red', spaceAfter: 1 };
const BODY_11 = { size: 11 };

const p3 = page(
  [
    txt(
      '<p>VILLAGE OF RYE BROOK<br>DEPARTMENT OF PARKS AND RECREATION<br>938 KING STREET, RYE BROOK, NEW YORK  10573</p>',
      { full: true, typo: { size: 14, weight: 700, align: 'center', color: '@purple', spaceAfter: 8 } },
    ),
    table(
      tbl([], [
        ['Recreation Phone Directory Number', ''],
        ['Robert Bertolacci, Superintendent', '939-7054'],
        ['Benjamin Becker, Recreation Supervisor', '305-2948'],
        ['Rocco Furano, Recreation Assistant', '305-2949'],
        ['Rose D’Ascoli, Office Assistant', '937-6663'],
        ['Recreation Department', '939-3235'],
        ['Recreation Department Fax', '937-7438'],
        ['Rye Brook After School for Kids', '438-2086'],
        ['', ''],
        ['Parks Phone Directory', ''],
        ['Paul Vinci, Parks Foreman', '939–1796'],
      ], { cols: [3.1, 1], fill: '@pink', border: 0 }),
      { col: 0 },
    ),
    photo(IMG.fallPond, { col: 1, height: 2.35 }),
    txt('<p>Village Parks</p>', {
      full: true, typo: { size: 19, weight: 700, align: 'center', color: '@purple', spaceAfter: 6 },
    }),

    txt('<p>Pine Ridge Park</p>', { col: 0, typo: PARK_HEAD }),
    txt('<p>Pine Ridge Park is located on the corner of Mohegan Lane and Latonia Drive.  This Park features: 2.5 basketball courts, 2 Little League baseball fields, 4 tennis courts, a tennis wall, playground and bathrooms.  <strong>AED in bathroom.</strong></p>', { col: 0, typo: BODY_11 }),
    lv([['Program Usage:', 'RB Rebels, RB Mayhem,'], ['', 'Justintime Baseball, BBHS Tennis,'], ['', 'RB Tennis instruction']], { col: 0, labelWidth: 84 }),
    txt('<p>Directions:<br>N. Ridge St. to Betsy Brown Rd.  Make a right onto Elm Hill Dr.  Take your first Right onto Old Oak Dr.  Make your First Left onto Bonwit Rd.  Make your next right on Mohegan Ln. The park will be on your right.</p><p style="text-align:center">or</p><p>Lincoln Ave to Pine Ridge Rd.  Make your first right onto Mohegan.  At the top of the hill drive into the park.</p>', { col: 0, typo: BODY_11 }),
    txt('<p>Anthony J. Posillipo Community Center</p>', { col: 0, typo: PARK_HEAD }),
    txt('<p>The Center is utilized for Senior Citizens on weekdays, recreation on week nights and is available for rental on the weekends. For more information contact the Center directly at 939-7904.</p>', { col: 0, typo: BODY_11 }),
    txt('<p>Rye Brook Athletic Field</p>', { col: 0, typo: PARK_HEAD }),
    txt('<p>Rye Brook Athletic Field is located at 830 King St.  This park features artificial turf soccer/football field, artificial turf softball field and  bathrooms.  <strong>AED in bathroom.</strong></p>', { col: 0, typo: BODY_11 }),
    lv([['Program Usage:', 'RB Travel Soccer, Blind  Brook'], ['', 'Football, Blind Brook Soccer,'], ['', 'NY Soccer Club, Old Timers Soccer']], { col: 0, labelWidth: 84 }),
    txt('<p>Directions:<br>King Street to Blind Brook High School.  Park in Blind Brook High School parking lot and walk down to field.</p>', { col: 0, typo: BODY_11 }),

    txt('<p>Rye Hills Park</p>', { col: 1, typo: PARK_HEAD }),
    txt('<p>Rye Hills Park is a passive park located behind the wall at Crawford Park and off of Park Ridge Ct in the Hidden Fall Development.    This park features: a walking path, a basketball court, 3 pickle ball courts, 2 game tables, a circle ring and a belvedere which overlooks Long Island Sound.</p><p>Directions:<br>North Ridge Street to Crawford Park Driveway.  Park next to the mansion and walk through the path wall and into the park.</p><p>Handicap vehicles -  North Ridge St. to Long Ledge Dr. (Hidden Fall Entrance).  Make a left onto Park Ridge Ct.  Make your next left into the park.  Park in the spaces allocated for handicap vehicles.</p>', { col: 1, typo: BODY_11 }),
    txt('<p>Harkness Park</p>', { col: 1, typo: PARK_HEAD }),
    txt('<p>Harkness Park is located on King Street adjacent to the Blind Brook High School campus.  This park features 4 tennis courts. <strong>AED on Tennis shed.</strong></p>', { col: 1, typo: BODY_11 }),
    lv([['Special Usage:', 'Blind Brook High School Tennis Team']], { col: 1, labelWidth: 82 }),
    txt('<p>Directions:<br>King Street to Blind Brook High School.  Park in Blind Brook High School parking lot and walk to tennis courts.</p>', { col: 1, typo: BODY_11 }),
    txt('<p>Garibaldi Park</p>', { col: 1, typo: PARK_HEAD }),
    txt('<p>Garibaldi Park is located on Garibaldi Place. This park features:  2 basketball courts, 3 pickleball courts, 1 baseball field, a playground and bathrooms.  <strong>AED in bathroom.</strong></p><p>Directions:<br>S. Ridge St to Garibaldi Place.  Park is on your left.  Parking lot on corner of Ridge St and Garibaldi Place.</p>', { col: 1, typo: BODY_11 }),
  ],
  {},
);

// ---------------------------------------------------------------- page 4
const SUB_HEAD = { size: 12.5, weight: 700 as const, color: '@purple', spaceAfter: 1 };

const p4 = page(
  [
    sec('General Information'),

    txt('<p><span style="color:#A349A4"><strong>Refunds</strong></span>: All refunds that are requested prior to the start of the program will be given with a $40.00 handling fee deducted.</p><p>All Refunds after the start of the program will be given with the greater of a prorated rate or $40.00 handling fee deducted.<br>There will be <strong><u>NO</u> refunds</strong> given for youth sport leagues after the teams are made.<br>Please note that all programs will not run when school is closed or cancelled. Residents wishing additional information should contact the Recreation Office at 939-3235.</p>', { col: 0, typo: BODY_11 }),
    gap(10, { col: 0 }),
    txt('<p>Advertising Sponsors Sought for 2025-2026 Winter  Brochure</p>', { col: 0, typo: SUB_HEAD }),
    txt('<p>The Rye Brook Parks and Recreation Department will place business card size ads in our Activity Brochure.  We are seeking a limited number of  businesses to advertise as sponsors in the upcoming Activity Brochure.</p>', { col: 0, typo: BODY_11 }),
    lv([['Ad Rate  (3) times:', '$125.00'], ['Ad Rate  (2) times:', '$100.00'], ['Ad Rate  (1) time:', '$ 75.00']], { col: 0, labelWidth: 108 }),
    gap(8, { col: 0 }),
    txt('<p>Should you have an interest, please enclose your business card and make your check payable to Rye Brook Recreation and mail to Rye Brook Recreation, 938 King Street, Rye Brook, New York  10573.</p>', { col: 0, typo: BODY_11 }),
    lv([['Telephone #:', '937-6663'], ['Fax #:', '937-7438'], ['Office Hours:', '8:30am – 4:30pm'], ['', 'Monday through Friday']], { col: 0, labelWidth: 84 }),
    REG_CALLOUT(0),

    txt('<p><u>SPECIAL NOTE</u></p>', { col: 1, typo: SUB_HEAD }),
    txt('<p>Rye Brook Parks and Recreation Department is always looking for new and innovative talent within its community boundaries.  If you possess a skill and the ability to teach it, please mail us your resume to vrbrec@ryebrookny.gov.</p>', { col: 1, typo: BODY_11 }),
    txt('<p>Little League Sponsors Sought for Our 2026 Spring Season</p>', { col: 1, typo: SUB_HEAD }),
    txt('<p>The sponsorship fee for our spring Little League Baseball is $700.00 for new sponsors and $500.00 for returning sponsors.  Each sponsor will have their company name on a banner that will be placed on the fence at Pine Ridge Park for the entire spring, summer and fall seasons.  The sponsors names will also be printed on the back of the jerseys and all team schedules.  For additional information, please call the Rye Brook Recreation Department at 939-7054.</p>', { col: 1, typo: BODY_11 }),
    gap(24, { col: 1 }),
    {
      id: newId(), span: 'column', col: 1, background: F('@cyan'), typo: {}, padding: 7,
      type: 'directoryBox',
      props: {
        title: 'DIRECTORY', titleFont: 'cinzel', padding: 0, borderColor: '@black', borderWidth: 3,
        entries: [
          { label: 'Park information', page: '3' },
          { label: 'General Information', page: '4' },
          { label: 'Youth Basketball', page: '5' },
          { label: 'Youth Tennis', page: '7' },
          { label: 'Youth Activities', page: '8' },
          { label: 'Paula’s Pals', page: '10' },
          { label: 'Special Events', page: '11' },
          { label: 'Special Population', page: '12' },
          { label: 'Adult Activities', page: '12' },
          { label: 'Pickleball', page: '13' },
          { label: 'Registration Form', page: '14' },
        ],
      },
    },
    gap(14, { col: 1 }),
    {
      id: newId(), span: 'column', col: 1, background: { kind: 'none' }, typo: {}, padding: 0,
      type: 'socialRow',
      props: {
        prefix: '',
        items: [{ icon: 'x', handle: '@ryebrookrec' }, { icon: 'instagram', handle: '@ryebrookrec' }],
        iconSize: 30, gap: 12,
      },
    },
  ],
  {},
);

// ---------------------------------------------------------------- page 5
const p5 = page(
  [
    sec('Youth Basketball'),

    txt('<p>YOUTH BASKETBALL<br>RATINGS SCHEDULE</p>', { col: 0, typo: { size: 14, weight: 700, color: '@purple', underline: true, align: 'center', spaceAfter: 4 } }),
    table(
      tbl([], [
        ['Boys and Girls', 'Dates', 'Time', 'Location'],
        ['2nd -3rd  Boys', '10/15 or 10/22', '7:15pm', 'RSS New Gym'],
        ['2nd - 3rd Girls', '10/15 or 10/22', '6:30pm', 'RSS New Gym'],
        ['', '', '', ''],
        ['4th-5th  Boys', '10/14 or 10/21', '6:30pm', 'RSS New Gym'],
        ['4th-5th  Girls', '10/14 or 10/21', '7:15pm', 'RSS New Gym'],
        ['', '', '', ''],
        ['6th-7th  Boys', '10/16 or 10/23', '7:15pm', 'RSS New Gym'],
        ['6th-7th  Girls', '10/16 or 10/23', '6:30pm', 'RSS New Gym'],
        ['', '', '', ''],
        ['Boys', 'Dates', 'Time', 'Location'],
        ['8th-11th', '10/17 or 10/24', '7:15pm', 'RSS New Gym'],
      ], { cols: [1.45, 1.5, 0.95, 1.6], fill: '@pink', border: 1 }),
      { col: 0 },
    ),
    txt('<p>All participants in the Youth Basketball program must attend <strong><u>ONE</u></strong> of the above  rating sessions to participate in the leagues. All ratings will take place at RSS Gym</p><p>Anyone interested in coaching basketball, please contact Ben @ bbecker@ryebrookny.gov or call (914) 939-3235.</p>', { col: 0 }),
    gap(28, { col: 0 }),
    txt('<p>ADVANCED REGISTRATION IS REQUIRED BEFORE RATINGS.<br><span style="color:#CC0000">Ratings Are Mandatory</span></p>', { col: 0, typo: { size: 14, weight: 700, align: 'center', spaceAfter: 8 } }),

    prog({
      col: 0, heading: '2nd & 3rd Grade Boys Basketball',
      body: '<p>The 2nd and 3rd grade boys program will be an instructional league using 8-foot baskets. All children must attend <strong><u>ONE</u></strong> rating session.  Children will be rated and placed on teams via the blind draft system. Games will be played on Saturday afternoons with 30 minutes of drills preceding a 45-minute game. Volunteer coaches will run the drills and coach the games. Games/Practices will begin on Saturday, 12/6/25.</p>',
      table: ratingTable('Oct 15th or Oct 22nd', '7:15pm'),
      meta: [['Who:', '2nd & 3rd Grade Boys']],
      note: CHECKS,
    }),
    txt('<p>Youth Basketball ratings for the rating session dates and times.</p>', { col: 0, typo: { spaceAfter: 0 } }),
    prog({
      col: 0, heading: '2nd & 3rd Grade Girls Basketball',
      body: '<p>The 2nd and 3rd grade girls basketball program will be more of an instructional league using 8-foot baskets.  All children must attend <strong><u>ONE</u></strong> rating session.  Children will be rated and placed on teams via the blind draft system. Games will be played on Saturday afternoons with 30 minutes of drills preceding a 45-minute game. Volunteer coaches will run the drills and coach the games. Games will begin on Saturday, 12/6/25.</p>',
      table: ratingTable('Oct 15th or Oct 22nd', '6:30pm'),
      meta: [['Who:', '2nd & 3rd Grade Girls']],
      note: CHECKS,
    }),

    prog({
      col: 1, heading: '4th & 5th Grade Boys Basketball',
      body: '<p>The 4th and 5th grade boys program will utilize the 10 foot baskets. All children must attend <strong><u>ONE</u></strong> rating session. Children will be rated and placed on teams via the blind draft system. Games will be played on Saturday afternoons with the possibility of occasional weeknight or Sunday games. There will be one practice per week. Practices will take place on Mon, Tue, Wed, or Thu on a rotating basis. Volunteer coaches will run the practices and coach the games. Games will begin on 12/6/25.</p>',
      meta: [['Who:', '4th & 5th Grade Boys.']],
      table: ratingTable('Oct 14th  or Oct 21st', '6:30pm'),
      note: CHECKS,
    }),
    prog({
      col: 1, heading: '4th & 5th Grade Girls Basketball',
      body: '<p>The 4th and 5th grade girls basketball program will utilize the 10-foot baskets.  All children must attend <strong><u>ONE</u></strong> rating session.  Children will be rated and placed on teams via the blind draft system. Games will be played on Saturday afternoons, with occasional weeknight/Sunday games. There will be one practice per week. Practices will take place on Mon, Tue, Wed, or Thu on a rotating basis. Volunteer coaches will run the drills and coach the games. Games will begin on Saturday, 12/6/25</p>',
      table: ratingTable('Oct 14th  or Oct 21st', '7:15pm'),
      meta: [['Who:', '4th & 5th Grade Girls']],
      note: CHECKS,
    }),
    prog({
      col: 1, heading: '6th & 7th Grade Boys Basketball',
      body: '<p>The 6th and 7th grade boys program will utilize 10-foot baskets.  All children must attend <strong><u>ONE</u></strong> rating session. Children will be rated and placed on teams via the blind draft system.  Games will be played on Friday nights and Sunday afternoons with the possibility of an occasional weeknight game. There will be one practice per week.  Practices will take place on Mon, Tue, Wed, or Thu on a rotating basis.  Volunteer coaches will run the practices and coach the games.  Games will begin on Sunday, 12/7/25.</p>',
      table: ratingTable('Oct 16th or Oct 23rd', '7:15pm'),
      meta: [['Who:', '6th & 7th Grade Boys']],
      note: CHECKS,
    }),
    txt('<p>Scan for Rye Brook Events</p>', { col: 1, typo: { size: 14, weight: 700, align: 'center', color: '@purple', spaceAfter: 3 } }),
    qr('https://www.ryebrookny.gov/calendar', { col: 1, size: 1.95 }),
  ],
  {},
);

// ---------------------------------------------------------------- page 6
const p6 = page(
  [
    sec('Youth Basketball'),

    prog({
      col: 0, heading: '6th & 7th Grade Girls Basketball',
      body: '<p>The 6th and 7th grade girls basketball program will utilize the 10-foot baskets.  All children must attend one of the rating sessions.  Children will be rated and placed on teams via the blind draft system. Games will be played on Friday nights and Sunday afternoons with the possibility of an occasional weeknight game.  There will be one practice per week. Practices will take place on Mon, Tue, Wed, or Thu on a rotating basis. Volunteer coaches will run the drills and coach the games. Games will begin on Sunday, 12/7/25.</p>',
      table: ratingTable('Oct 16th or Oct 23rd', '7:15pm'),
      meta: [['Who:', '6th & 7th  Grade Girls']],
      note: CHECKS,
    }),
    prog({
      col: 0, heading: '8th & 9th Grade Boys Basketball',
      body: '<p>Boys will participate in this transitional league will familiarize the boys with the high school plays.  The Varsity players will coach the teams and certified referees will referee games.  Games will begin on 12/6/25.</p>',
      table: ratingTable('Oct 17th or Oct 24th', '7:15pm'),
      meta: [['Who:', '8th & 9th Grade Boys']],
      note: CHECKS,
    }),
    prog({
      col: 0, heading: '10th & 11th Grade Boys Basketball',
      body: '<p>Boys will participate in this transitional league that will familiarize the boys with the high school plays.  The Varsity players will coach the teams and certified referees will referee games.  Games will begin on 12/7/25</p>',
      meta: [['Who:', '10th & 11th Grade Non-Varsity Boys']],
      table: ratingTable('Oct 17th or Oct 24th', '7:15pm'),
      note: CHECKS,
      metaLabelWidth: 52,
    }),
    REG_CALLOUT(0),

    txt('<p>Scan for Rye Brook Events</p>', { col: 1, typo: { size: 14, weight: 700, align: 'center', color: '@purple', spaceAfter: 3 } }),
    qr('https://www.ryebrookny.gov/calendar', { col: 1, size: 3.05 }),
    prog({
      col: 1, heading: 'Coaches Mandatory CPR',
      body: '<p>All coaches must have a current 2 year CPR/AED certification. Below are classes offered by the Port Chester - Rye - Rye Brook EMS:<br>CPR/AED<br><span style="color:#00AEEF"><strong>November 5th from 6-9pm at EMS HQ<br>November 19th from 6-9pm at EMS HQ<br>December 3rd from 6-9pm at EMS HQ</strong></span><br>To register for one of these classes, please email Michael Wellington @ mwellington@pcrrbems.com and copy bbecker@ryebrookny.gov and indicate that you are a volunteer coach for Rye Brook Recreation.</p>',
    }),
    photo(IMG.basketball, { col: 1, height: 3.4 }),
  ],
  {},
);

// ---------------------------------------------------------------- page 7
const tennisNote = '<p>Players need to bring their own racket.    <strong>No phone or mail registrations will be taken for this program. For information please call 914-273-8500.</strong></p>';
const tennisTable = (rows: string[][]) =>
  tbl(['Day', 'Date', 'Time', 'Fee', 'Location'], rows, { cols: [0.6, 1.5, 1.65, 0.72, 1.1], border: 0 });

const p7 = page(
  [
    sec('Youth Tennis'),

    prog({
      col: 0, heading: 'Pee Wee Tennis',
      body: '<p>This program is designed to introduce 4 &amp; 5 year olds to tennis in a fun and rewarding way.  Players need to provide their own racket.  <strong>No phone or mail registrations will be taken for this program. For information please call 914-273-8500.</strong></p>',
      table: tennisTable([['Tue', '9/9– 10/21', '2:30 - 3:15pm', '$150', 'PRP'], ['Wed', '9/10 - 10/22', '2:30 - 3:15pm', '$150', 'PRP']]),
      meta: [['Who:', '4 & 5 year-olds'], ['', '(MUST be 4 years old by 9/13)'], ['', '     (6 sessions)'], ['Min/Max:', '3 to 12 participants']],
      note: CHECKS, metaLabelWidth: 68,
    }),
    gap(22, { col: 0 }),
    prog({
      col: 0, heading: 'Kdg. 1st & 2nd Grade Youth Tennis',
      body: tennisNote,
      table: tennisTable([['Tue', '9/9 - 10/21', '4-5pm', '$192', 'PRP'], ['Wed', '9/10 -10/22', '4-5pm', '$192', 'PRP']]),
      meta: [['Who:', 'K, 1st and 2nd Grade'], ['', '  Boys and Girls'], ['', '(6 sessions)'], ['Min/Max:', '3 to 12 participants']],
      note: CHECKS, metaLabelWidth: 68,
    }),

    prog({
      col: 1, heading: '3rd - 5th Grade Youth Tennis',
      body: tennisNote,
      table: tennisTable([['Tue', '9/9– 10/21', '5-6pm', '$192', 'PRP'], ['Wed', '9/10- 10/22', '5-6pm', '$192', 'PRP']]),
      meta: [['Who:', '3rd  - 5th Grade'], ['', 'Boys and Girls'], ['', '  (6 sessions)'], ['Min/Max:', '3 to 12 participants']],
      note: CHECKS, metaLabelWidth: 68,
    }),
    gap(22, { col: 1 }),
    prog({
      col: 1, heading: 'Middle & High School Tennis',
      body: tennisNote,
      table: tennisTable([['Tue', '9/9– 10/21', '3:15 - 4pm', '$192', 'PRP'], ['Wed', '9/10 - 10/22', '3:15 - 4pm', '$192', 'PRP']]),
      meta: [['Who:', 'Grade 6 & up'], ['', '  (6 sessions)'], ['Min/Max:', '3 to 12 participants']],
      note: CHECKS, metaLabelWidth: 68,
    }),

    gap(18, { col: 0 }),
    txt('<p>Tennis Rain Policy</p>', { full: true, typo: { size: 14, weight: 700, align: 'center', color: '@cyan', spaceAfter: 4 } }),
    txt('<p>If it is raining at the time of your lesson and the weather is questionable, it is the players’ responsibility to go and check the condition of the courts at the scheduled time of the lesson.  If it is possible to determine in advance that lessons will be cancelled due to inclement weather, please call 914-273-8500 for more details.</p>', { full: true, typo: { weight: 700, size: 12.5, align: 'justify' } }),
    gap(14, { col: 0 }),
    hl(
      '<p>Save the Date:<br><span style="color:#00AEEF"><em><u>Winterfest 2025</u></em></span><br>December 5th @ Pine Ridge Park<br>6:00-9:00pm<br><em>Don’t miss out on this fun event to bring in the holiday season</em></p>',
      { size: 21, padding: 14, border: 3, borderColor: '@cyan', rightImage: IMG.tree, sideImageWidth: 78 },
    ),
  ],
  {},
);

// ---------------------------------------------------------------- page 8
const classTable = (rows: string[][], head = ['Day', 'Dates', 'Time', 'Fee', 'Location']) =>
  tbl(head, rows, { cols: [0.62, 1.5, 1.75, 0.72, 1.5], border: 0 });

const p8 = page(
  [
    sec('Youth Activities'),

    prog({
      col: 0, heading: 'Fall Youth Volleyball',
      body: '<p>Youth Instructional Play.  Players will learn from the Blind Brook High School Varsity Coach the fundamentals of Volleyball (passing, setting, spiking and rotation)  Be the future of Blind Brook Volleyball!</p>',
      table: classTable([['Wed', '10/29 - 12/10', '6:30 - 7:30pm', '$110', 'BBHS Gym']]),
      meta: [['Grades:', '3rd - 6th Grade'], ['Instructor:', 'Gina Carlone, BBHS Varsity Volleyball Coach']],
      note: CHECKS, metaLabelWidth: 68,
    }),
    prog({
      col: 0, heading: 'Fall T-Ball & Rookie League',
      body: '<p>Season Details:<br><strong>Dates:</strong> Sept 12-Oct 18<br><strong>Duration:</strong> 6 weeks<br><strong>Fee:</strong> $250</p>',
    }),
    prog({
      col: 0, heading: 'T-Ball',
      meta: [['Age Group:', 'Co-ed Pre-K (age 4+) & Kindergarten'], ['Schedule:', 'Sundays from 9:00–10:00 AM']],
      metaLabelWidth: 84,
    }),
    txt('<p>Each session includes skill-building drills followed by a scrimmage</p>', { col: 0, typo: { spaceAfter: 0 } }),
    lv([['Location:', 'RBAF']], { col: 0, labelWidth: 84, valueBold: false }),
    prog({
      col: 0, heading: 'Rookie League',
      meta: [['Age Group:', 'Co-ed 1st, 2nd, and 3rd Grade'], ['Schedule:', 'Practice Fridays, 4:30–5:30 PM,'], ['', 'Games Saturdays at 12:30 PM or 2:00 PM'], ['Location:', 'Pine Ridge Park']],
      metaLabelWidth: 84,
    }),
    prog({
      col: 0, heading: 'Fall Baseball Skills Clinic (Minors & Majors)',
      body: '<p>For players in the Minors and Majors divisions (ages 7–12), we’re offering a 6-week skills clinic designed to build well-rounded fundamentals through focused weekly themes.</p>',
      meta: [['Dates:', 'Sept 11-Oct 23 (Skip Oct 2nd due to holiday)'], ['Duration:', '6 weeks'], ['Ages:', '7–12 (Minors & Majors divisions)'], ['Dates/Times:', 'Thursdays 4:00-5:00 PM'], ['Location:', 'Pine Ridge Park'], ['Fee:', '$250']],
      metaLabelWidth: 84,
    }),
    txt('<p>Weekly Focus:</p>', { col: 0, typo: { weight: 700, color: '@purple', spaceAfter: 3 } }),
    lv([
      ['Week 1:', 'Fielding Fundamentals – infield & outfield techniques, glove work, footwork, and defensive positioning'],
      ['Week 2:', 'Pitching & Catching – throwing mechanics, proper arm care, accuracy, blocking, receiving, and foot work behind the plate'],
      ['Week 3:', 'Hitting Basics – stance, swing path, and building consistent contact'],
      ['Week 4:', 'Advanced Hitting – situational hitting, approach at the plate, and developing power'],
      ['Week 5:', 'Base Running & Game IQ – leads, steals, reading plays, and making smart decisions on the bases'],
      ['Week 6:', 'Live Game Situations – combining all skills with scrimmage-style drills'],
    ], { col: 0, labelWidth: 64, valueBold: false }),

    prog({
      col: 1, heading: 'Babysitting Course',
      body: '<p>This valuable course will be offered every year as a service to our residents and neighbors.  It provides good basic training for our students to be qualified babysitters.  As a babysitter, you are responsible for the care and safety of our youth. Regardless of your age, you are performing a valuable and needed service for which you can be justly proud. We want you, the children for whom you are caring for and their parents to feel secure while you are babysitting. <strong>The course will be given at the Rye Brook Fire House 940 King Street, Rye Brook, 7:00 to 9:00 PM on Monday and Wednesday evenings from Oct. 6th to Oct 27th, 2025.</strong>  The instructors for the <em>Baby Sitters Course</em> include a Physician, Registered Nurse, a Police Department Public Safety Officer, a Director of a local pre-school center, a Paramedic, and Fire Department Training Instructors. Classroom lecture is combined with instructor demonstrations and visual media. Students also participate in hands-on classes such as First Aid, Rescue Breathing, Infant Care, Fire Extinguisher use, and much more. All students receive a <em>Baby Sitter Course</em> handbook and supplemental literature.  <strong>Early registration is necessary.</strong> The class is limited to 10 students with Rye Brook residents receiving priority. Those accepted into the class will be contacted either by phone or e-mail. For more information, please contact the Rye Brook Fire Department at 939-5144 or stop in at Fire House at 940 King Street, Rye Brook, NY.  At the completion of this course, a listing of <em>Baby Sitter Course</em> Graduates, who grant us permission to use their name, will be made available to the public by the Rye Brook Fire Department. This is done as a public service to those who are seeking the services of a qualified, responsible baby sitter.</p>',
      table: tbl(['Dates', 'Days', 'Time', 'Fee', 'Location'], [['10/6- 10/27', 'Mo & We', '7–9pm', '$25', 'Rye Brook Firehouse']], { cols: [1.5, 1.3, 1.1, 0.8, 2.3] }),
      meta: [['Who:', 'Current 7th Graders and older']],
      metaLabelWidth: 52,
    }),
    prog({
      col: 1, heading: 'After School for Kids',
      body: '<p><strong><u>After School for Kids</u></strong> is an after school program at Ridge Street School.  The typical after-school program times will be from dismissal (approx. 3:10pm) until 6:30pm (pickups can occur at any time in between) and the times will be extended when shorter school days are scheduled in advance.  As in the past, if your child is participating in a separate PTA or Recreation program at Ridge Street Elementary School during the after-school program hours, Rye Brook Recreation employees will bring and return the children to these programs as well.    For those not registered in any other alternative programs, the children will be busy with a variety of recreational activities.</p>',
      table: tbl(['Days', 'Dates', 'Fee', 'Location'], [
        ['2 days', '9/2 - 6/25', '$295/month', 'RSS MPR'],
        ['3 days', '9/2 - 6/25', '$400/month', 'RSS MPR'],
        ['4 days', '9/2 - 6/25', '$495/month', 'RSS MPR'],
        ['5 days', '9/2 - 6/25', '$575/month', 'RSS MPR'],
      ], { cols: [1, 1.4, 1.5, 1.4], border: 0 }),
      meta: [['Who:', 'RSS Students K-5']],
      note: CHECKS, metaLabelWidth: 52,
    }),
    REG_CALLOUT(1),
  ],
  {},
);

// ---------------------------------------------------------------- page 9
const p9 = page(
  [
    sec('Youth Activities'),

    prog({
      col: 0, heading: 'Snapology',
      body: '<p><strong>Program: Mining and Building</strong><br><strong style="font-size:1.15em">Description:</strong> Travel to the Nether with Snapology, but watch out for those creepers! Join us as we bring Minecraft® to life using LEGO® bricks and creativity as we have a blast bonding over the game we all love to play. Each day students will work on awesome activities that will allow them to create their own Minecraft® world using bricks, including animals, creepers, 3D Minecraft® characters, and more. Lessons involve critical thinking, architecture, socialization, and a whole lot of imagination. Minecraft® makers will come together to make awesome builds each week!</p>',
      table: tbl(['Day', 'Who', 'Dates', 'Time', 'Fee', 'Loc.'], [['Thu', 'K - 3rd Grade', '10/9 - 11/13', '3:15 - 4:15pm', '$175', 'R.S.S.']], { cols: [0.6, 1.6, 1.6, 1.7, 0.8, 0.8], border: 0 }),
      note: 'Minimum of 6 to run the program to a maximum of 12',
    }),
    prog({
      col: 0, heading: 'Young Entrepreneurs',
      body: '<p><span style="color:#A349A4"><strong>Grades 3-5</strong></span><br>This program empowers students with an entrepreneurial mindset develop a plan for their very own business ideas drawing from such disciplines as marketing, finance and strategy, in a supportive environment fostering teamwork.  From designing marketing flyers top estimating profits, students have fun while developing business savvy!</p>',
      table: tbl(['Day', 'Dates', 'Time', 'Fee', 'Location'], [['Tue.', '10/7– 11/25', '3:15 - 4:15pm', '$180', 'RSS Room TBA']], { cols: [0.8, 1.6, 1.6, 0.9, 2], border: 0 }),
    }),
    txt('<p><strong>M</strong>inimum class size: 8          <strong>Maximum class size</strong>: 16</p>', { col: 0 }),
    prog({
      col: 0, heading: 'My First Piggy Bank',
      body: '<p><span style="color:#A349A4"><strong>Grades K-2</strong></span><br>Earn, save, spend, donate! Through math games and hands-on activities kids learn about these and other key financial concepts like money, budgeting and saving. Students will also learn the basic concepts of philanthropy and donating to charity. And, everyone will make their very own piggy bank to take home!</p>',
      table: tbl(['Day', 'Dates', 'Time', 'Fee', 'Location'], [['Mon.', '10/6– 11/17', '3:15 - 4:15pm', '$180', 'RSS Room TBA']], { cols: [0.8, 1.6, 1.6, 0.9, 2], border: 0 }),
    }),
    txt('<p><strong>M</strong>inimum class size: 8          <strong>Maximum class size</strong>: 16</p>', { col: 0 }),

    prog({
      col: 1, heading: 'Finance Club',
      body: '<p><span style="color:#A349A4"><strong>Grades 6-8</strong></span></p>',
      table: tbl(['Day', 'Dates', 'Time', 'Fee', 'Location'], [['Wed', '10/8– 11/12', '3:15 - 4:15pm', '$180', 'BBMS Room TBA']], { cols: [0.7, 1.6, 1.7, 0.9, 2.1], border: 0 }),
    }),
    txt('<p>Learn how to manage your money in this program promoting essential life skills!  Set your financial goals, develop a budget from scratch, shop for a credit card and calculate the monthly cost of your dream car.</p><p>Students learn about mortgages, FICO scores, taxes and the dangers of piling on debt.  Through simulations and hands on activities, students explore financial decisions they will have to make in the future.</p><p><strong>M</strong>inimum class size: 8          <strong>Maximum class size</strong>: 16</p>', { col: 1 }),
    prog({
      col: 1, heading: 'Youth Lacrosse',
      body: '<p>This program was designed for beginners with little or no previous lacrosse experience who are interested in learning more about the game. Children will learn the fundamental skills and rules of lacrosse during this 8 week program. All activities at this level are non-contact as we are just beginning to learn game play, however we require that all kids have a mouth guard. Some program highlights are cradling and scooping, running with the ball, throwing, catching and shooting</p>',
      meta: [['Who:', 'K - 2nd Grade']],
      table: tbl(['Who', 'Days', 'Dates', 'Time', 'Fee', 'Location'], [
        ['Boys', 'Tue', '9/16 - 11/4', '4 - 5pm', '$330', 'Rye Hills Park'],
        ['Girls', 'Wed', '9/17 - 11/5', '4 - 5pm', '$330', 'Rye Hills Park'],
      ], { cols: [0.75, 0.8, 1.35, 1.1, 0.8, 1.7] }),
      metaLabelWidth: 62,
    }),
    txt('<p>Minimum: 8                Maximum: 16</p>', { col: 1 }),
    txt(`<p>${CHECKS}</p>`, { col: 1, typo: { font: 'carlito', weight: 700, size: 10, color: '@violet' } }),
    REG_CALLOUT(1),
    photo(IMG.pumpkins, { width: 'bleed', height: 2.65 }),
  ],
  {},
);

// ---------------------------------------------------------------- page 10
const p10 = page(
  [
    gap(58),
    txt('<p>WARMING COMMUNITIES<br>ONE COAT AT A TIME</p>', { full: true, typo: { size: 22, weight: 700, align: 'center', color: '@red', spaceAfter: 8 } }),
    photo(IMG.heart, { width: 'full', height: 2.05, fit: 'contain' }),
    gap(14),
    txt('<p><span style="color:#CC0000"><strong>PAULA’S PALS<br>15TH  ANNUAL COAT DRIVE</strong></span><br>is collecting clean, reusable coats</p><p>September 25th - December 5th, 2025<br>Collection boxes are located at:</p><p>Rye Brook Recreation Office, 938 King Street<br>Rye Brook Posillipo Center, 32 Garibaldi Place</p><p>In loving Memory of Paula Paniccia-Bertolacci<br>(for more information call 914-939-3235)</p>', { full: true, typo: { size: 21, align: 'center', lineHeight: 1.22 } }),
  ],
  { margin: 1.15, columns: 1, frame: { color: '@purple', width: 3, inset: 1.0 } },
);

// ---------------------------------------------------------------- page 11
const EVT_HEAD = { size: 14, weight: 700 as const, color: '@purple', spaceAfter: 2 };

const p11 = page(
  [
    sec('Special Events'),

    txt('<p>Back to School Movie in the Park</p>', { col: 0, typo: EVT_HEAD }),
    photo(IMG.moviePark, { col: 0, height: 1.05 }),
    gap(6, { col: 0 }),
    lv([
      ['Movie:', 'Snow White'], ['Who:', 'All Rye Brook Residents'], ['Location:', 'Pine Ridge Park'],
      ['Date:', 'September 5th (Rain Date: 9/6)'], ['Time:', '7:30pm'], ['Fee:', 'Free'],
    ], { col: 0, labelWidth: 68, valueColor: '@purple' }),
    txt('<p>Please come and enjoy a night with friends and family to view this Movie under the stars.<br>Mark your calendars.</p>', { col: 0 }),

    txt('<p>3rd Annual Pumpkin Patch</p>', { col: 0, typo: { ...EVT_HEAD, color: '@red' } }),
    txt('<p>The Pumpkin Patch event will give the opportunity for our residents to pick their pumpkins for Halloween.  We will have a limited number of pumpkins.  They will be available on a first come first served basis.  There will be some games and activities for the children while at the park.</p>', { col: 0 }),
    lv([
      ['Who:', 'Rye Brook Residents'], ['Date:', 'October 11th'],
      ['Location:', 'Pine Ridge Park Old Field'], ['Times:', '9am - 12pm'],
      ['Fees:', 'Small Pumpkin                $8'], ['', 'Medium Pumpkin           $10'], ['', 'Large Pumpkin               $12'],
    ], { col: 0, labelWidth: 68, valueBold: false }),

    txt('<p>Pumpkin Smash</p>', { col: 0, typo: EVT_HEAD }),
    txt('<p>This yearly event will provide an opportunity for you to see that your pumpkin is disposed of properly in a fun way.  We are still working out the details and will announce at the Pumpkin Patch event the plans for our event.</p>', { col: 0 }),
    txt('<p style="text-align:center">Save the Dates:</p>', { col: 0, typo: { spaceAfter: 0 } }),
    lv([['Pumpkin Patch', 'October 11th          9am - 12pm'], ['Pumpkin Smash', 'November 8th               TBA']], { col: 0, labelWidth: 104, valueBold: false }),
    txt('<p>Come join us for a fun time!</p>', { col: 0 }),

    txt('<p>Howloween in the Park</p>', { col: 1, typo: EVT_HEAD }),
    txt('<p>Bring your pets in costume for this event co-sponsored by the Humane Society of Westchester.  There will be prizes for the best 3 dog costumes.  There will be meet and greets with the Westchester Humane Society Pets for adoption.  In addition, there will be demonstrations from Service Dogs.  At the conclusion, there will be a costume parade of all of our dogs.</p>', { col: 1 }),
    lv([['Who:', 'Rye Brook Dogs in Costume'], ['Date:', 'October 25th'], ['Location:', 'Pine Ridge Park'], ['Registration:', '10:30am - 12:00pm'], ['Parade:', '11:45pm']], { col: 1, labelWidth: 86, valueBold: false }),
    gap(26, { col: 1 }),
    txt('<p>Trunk and Treat</p>', { col: 1, typo: { ...EVT_HEAD, color: '@red' } }),
    txt('<p>Come join in the fun with our 3rd Trunk and Treat event at Pine Ridge Park.  Come dressed in your Halloween costume and visit our Village staff in the Parking lot at Pine Ridge Park.  Each department in the Village will be decorating one of our vehicles and be giving out Halloween treats to those that visit with us.  We will be asking for your votes for the best decorated vehicle for bragging rights at Village Hall.</p>', { col: 1 }),
    lv([['Who:', 'Rye Brook Residents in costume'], ['Date:', 'October 29th'], ['Location:', 'Pine Ridge Park Parking Lot'], ['Times:', '6:00 - 7:00pm']], { col: 1, labelWidth: 86, valueBold: false }),
    gap(26, { col: 1 }),
    txt('<p>Winterfest</p>', { col: 1, typo: { ...EVT_HEAD, color: '@red' } }),
    txt('<p>Rye Brook will bring in the holiday season with this Christmas Tree and Menorah Lighting Ceremony</p>', { col: 1 }),
    lv([['Who:', 'All Residents'], ['Day/Time:', 'Friday, 6:00 - 9:00pm'], ['Date:', 'December 5th'], ['Location:', 'Pine Ridge Park']], { col: 1, labelWidth: 86 }),
    txt('<p>Come join us for this holiday event.  A special guest from the North Pole will be in attendance.  Ice sculptures will be carved, train rides and there will be other events scheduled in the park.</p>', { col: 1 }),

    hl(
      '<p>Save the Date:<br><span style="color:#00AEEF"><em><u>Winterfest 2025</u></em></span><br>December 5th @ Pine Ridge Park<br>6:00-9:00pm<br><em>Don’t miss out on this fun event to bring in the holiday season</em></p>',
      { size: 21, padding: 16 },
    ),
  ],
  {},
);

// ---------------------------------------------------------------- page 12
const p12 = page(
  [
    {
      id: newId(), span: 'full', col: 0, background: { kind: 'none' }, typo: { size: 20, weight: 700, align: 'center', underline: true, color: '@cyan' }, padding: 6,
      type: 'sectionTitle', props: { html: 'Special Population Programs' },
    },
    txt('<p><strong>SOUTHEAST CONSORTIUM</strong><br>The Village of Rye Brook Recreation Department is part of the South East Consortium for Special Services, Inc. which is a “not-for-profit” organization, dedicated to providing leisure services to eligible citizens with developmental or other disabilities.  The South East Consortium offers a variety of programs and services in an effort to meet the social, cultural and quality of life needs for children and adults of all ages and functioning abilities. We try to base all activities on the appropriateness of the participant and availability of resources.  We welcome your participation.  For further information, contact the South East Consortium, 740 West Boston Post Road, Suite 312, Mamaroneck, New York, 10543 and (914) 698-5232.<br>Dates:  <strong>September 2025-June 2026</strong></p>', { full: true, typo: { size: 12.5, align: 'justify' } }),
    sec('Adult Programs'),

    prog({
      col: 0, heading: 'Adult Group Tennis Instruction',
      body: '<p>Each player should bring their own racket and an unopened can of tennis balls to the first lesson.</p>',
      table: tbl(['Day', 'Dates', 'Time', 'Fee', 'Location'], [
        ['Wed', '9/10- 10/22', '9:30 -10:30', '$180', 'Pine Ridge'],
        ['', '', '10:30 -11:30', '$180', 'Pine Ridge'],
      ], { cols: [0.8, 1.6, 1.5, 0.9, 1.7], border: 0 }),
    }),
    txt('<p>Please call (914) 273-8500 to discuss class time requests.</p>', { col: 0, typo: { weight: 700, size: 11.5, spaceAfter: 1 } }),
    txt(`<p>${CHECKS}</p>`, { col: 0, typo: { font: 'carlito', weight: 700, size: 10, color: '@violet' } }),
    prog({
      col: 0, heading: 'Tennis Rain Policy',
      body: '<p><strong>If it is raining at the time of your lesson and the weather is questionable, it is the players’ responsibility to go and check the condition of the courts at the scheduled time of the lesson.  If it is possible to determine in advance that lessons will be cancelled due to inclement weather, please call 914-273-8500 for more details.</strong></p>',
    }),
    prog({
      col: 0, heading: 'Fire Extinguisher Training & Home Safety',
      body: '<p>Rye Brook Police and Fire are putting together this program which will talk about home safety and emphasize  how you can make your home safer.  The session will be run by a trained Rye Brook Firefighter and a police officer specializing in Home Safety.</p>',
      table: tbl(['Day', 'Dates', 'Times', 'Location', 'Fee'], [['Wed', 'Nov 12th', '7 - 9pm', 'RB Firehouse', 'FREE']], { cols: [0.8, 1.3, 1.2, 2, 1], border: 0 }),
    }),
    txt('<p><strong>Early registration is necessary.</strong> The class is limited to 25 participants with Rye Brook residents receiving priority. Those accepted into the class will be contacted by e-mail which will give further details about the program.<br><span style="color:#CC0000"><strong><em><u>LET’S MAKE RYE BROOK A SAFER PLACE!</u></em></strong></span></p>', { col: 0 }),

    prog({
      col: 1, heading: 'Men’s Basketball',
      meta: [['Who:', 'Adults']],
      table: tbl(['Day', 'Dates', 'Time', 'Fee', 'Location'], [['Sun', '10/19 - 3/22', '8:30am - 11:30am', '$300', 'BBHS Gym']], { cols: [0.7, 1.5, 2, 0.9, 1.5] }),
      note: CHECKS, metaLabelWidth: 52,
    }),
    txt('<p>A recreation staff member will confirm from the school each week for this program.  In case the school will not be available, participants in the program will be notified by email prior to the weekend.</p><p><strong>Should the school require the facility or be unable to provide a custodian, the program will not be held. An adult supervisor will be on site during the program.</strong></p>', { col: 1 }),
    prog({
      col: 1, heading: 'Adult Co-Ed Volleyball',
      body: '<p><strong>The Adult Competitive Volleyball league</strong> is designed for highly experienced players who have previously competed at the high school varsity team, club volleyball team, or collegiate level. This league provides an opportunity for athletes to continue playing at a high level of competition. Players must have prior experience in organized volleyball, either at the high school or college level. This ensures a competitive atmosphere for all participants.</p>',
      table: tbl(['Day', 'Dates', 'Time', 'Fee', 'Location'], [['Wed', '12/3 - 3/11', '8:00 - 10:00pm', '$200', 'BBHS Gym']], { cols: [0.7, 1.5, 2, 0.9, 1.5] }),
    }),
    txt('<p><strong>Skill Level</strong>: Advanced. Participants should possess a strong understanding of the game, including rotations, advanced techniques, and competitive gameplay.</p>', { col: 1 }),
    lv([['Coordinator:', 'Gina Carlone, BBHS Varsity Volleyball Coach']], { col: 1, labelWidth: 84, valueBold: false }),
    txt(`<p>${CHECKS}</p>`, { col: 1, typo: { font: 'carlito', weight: 700, size: 10, color: '@violet' } }),

    hl(
      '<p><span style="color:#A349A4">Back to School Movie in the Park<br><u>Snow White</u></span></p>',
      { fill: '#D9B3E6', size: 15, padding: 8, align: 'center' },
    ),
    {
      id: newId(), span: 'full', col: 0, background: F('#D9B3E6'), typo: { size: 13 }, padding: 8,
      type: 'labelValue',
      props: {
        rows: [
          { label: 'Location:', value: 'Pine Ridge Park' },
          { label: 'Date:', value: 'September 5th (Rain Date: 9/6)' },
          { label: 'Time:', value: '7:30pm' },
        ],
        labelWidth: 120, labelBold: true, valueBold: true, valueColor: '@purple',
      },
    },
  ],
  {},
);

// ---------------------------------------------------------------- page 13
const pbTable = (rows: string[][]) =>
  tbl(['Day', 'Dates', 'Time', 'Fee', 'Location'], rows, { cols: [0.6, 1.35, 1.6, 0.7, 1.55] });

const p13 = page(
  [
    sec('Adult Pickleball'),

    prog({
      col: 0, heading: 'Pickleball', headingColor: '@cyan',
      body: '<p>Come Play the Fastest Growing Low-Impact Racquet Sport in America, Pickleball! Pickleball is a fun sport that combines many elements of tennis, badminton and Ping-Pong. It’s played on a badminton-sized court with a slightly modified tennis net using a ping-pong style paddle and a plastic ball with holes. A Pickleball court is about one-third the size of a tennis court, which means less ground to cover perhaps explaining why it is particularly popular with 40+ men and women.</p>',
    }),
    photo(IMG.piz, { col: 0, height: 0.72, fit: 'contain' }),
    gap(8, { col: 0 }),
    txt('<p>Details on all programs can be found at www.pickleballimpactzone.com</p><p>Instructors: Michael, Erik or Nancy(Certified Instructors)</p><p>Weather policy: In the event of inclement weather, makeup sessions will be held at the end of the session. Please register on our TeamReach group to stay updated. Download app and enter code: Ryebrook</p>', { col: 0 }),
    txt('<p>Pickleball Lessons – 4 weeks<br>Ages 8-99</p>', { col: 0, typo: { weight: 700, size: 12, spaceAfter: 1 } }),
    txt('<p>This program is designed to be an introduction to Pickleball. 8-12 year old will have structured drills while still maintaining a playful approach. 13-15 year old will learn advanced stroke mechanics, tactical play and match strategy. <strong>Taught by PIZ Instructors</strong>.</p>', { col: 0 }),
    table(pbTable([['Sat', '9/13 - 10/4', '5:30– 7:00pm', '$125', 'Rye Hills Park'], ['', '10/18 - 11/8', '5:30– 7:00pm', '$125', 'Rye Hills Park']]), { col: 0 }),
    txt('<p>Intro to Pickleball Lessons<br>Ages 8-12</p>', { col: 0, typo: { weight: 700, size: 12, spaceAfter: 1 } }),
    lv([['Group A', '9:00 - 9:55am                    Max 12'], ['Group B', '10:00 - 10:55am                Max 6']], { col: 0, labelWidth: 108, valueBold: false }),
    txt('<p>Pickleball Basics Lessons<br>Ages 13-15</p>', { col: 0, typo: { weight: 700, size: 12, spaceAfter: 1 } }),
    lv([['Group C', '10:00 - 10:55am                Max 6'], ['Group D', '11:00 - 11:55am                Max 6']], { col: 0, labelWidth: 108, valueBold: false }),
    txt('<p>Pickleball Basics Lessons<br>16+ & Adults</p>', { col: 0, typo: { weight: 700, size: 12, spaceAfter: 1 } }),
    lv([['Group E', '11:00 - 11:55am                Max 6']], { col: 0, labelWidth: 108, valueBold: false }),

    prog({
      col: 1, heading: 'Coached Play Level 3.0 - 3.4', typo: { underline: false },
      body: '<p>Coached Play offers structured gameplay with our Impact Zone instructor providing real-time feedback and strategic tips. Must have good racket sport experience or played pickleball for more than a year.</p>',
      table: pbTable([['Mon', '9/8 - 9/29', '5:30 - 7:00pm', '$68', 'Rye Hills Park'], ['', '10/20- 11/10', '5:30 - 7:00pm', '$68', 'Rye Hills Park']]),
      meta: [['Min:  6   Max:  12', '']],
      note: CHECKS_MAKE, metaLabelWidth: 120,
    }),
    prog({
      col: 1, heading: 'Coached Play Level 2.5-3.0',
      body: '<p>Coached Play is designed to create an enjoyable and recreational setting where everyone can participate together. It facilitates connections among friends, family, and even strangers, fostering new friendships through a mutual love of the game. Similar to Open Play, our staff offers gentle guidance, positive reinforcement, and strategic tips during the sessions. This approach not only improves individual skills but also strengthens community bonds.</p>',
      table: pbTable([['Wed', '9/5 - 10/1', '5:30– 7:00pm', '$68', 'Garibaldi Park'], ['', '10/15 - 11/5', '5:30– 7:00pm', '$68', 'Garibaldi Park']]),
      meta: [['Min:  6   Max:  12', '']],
      note: CHECKS_MAKE, metaLabelWidth: 120,
    }),
    prog({
      col: 1, heading: 'Shot Selection of the Week',
      body: '<p>Weekly focus of 1. Serve &amp; Return Strategy, 2. 3rd Shot Decisions – Drive vs. Drop, 3. Transition Zone Play and 4. Lob, Overhead &amp; Defend</p>',
      table: pbTable([['Tue', '9/9 - 10/7', '6:00– 7:30pm', '$185', 'Rye Hills Park'], ['', '10/21- 11/11', '5:30– 7:00pm', '$185', 'Rye Hills Park']]),
      meta: [['Min:  3   Max:  12', '']],
      note: CHECKS_MAKE, metaLabelWidth: 120,
    }),
    prog({
      col: 1, heading: 'Advanced Beginner Lessons 2.5 - 3.0',
      body: '<p>You have played for a while, have racket sports background or completed intro to pickleball and are ready for the next level.</p>',
      table: pbTable([['Thu', '9/11 - 10/9', '5:30– 7:00pm', '$185', 'Garibaldi Park'], ['', '10/16 - 11/6', '5:30– 7:00pm', '$185', 'Garibaldi Park']]),
      meta: [['Min:  3   Max:  12', '']],
      note: CHECKS_MAKE, metaLabelWidth: 120,
    }),

    photo(IMG.pickleball, { width: 'bleed', height: 2.05 }),
  ],
  {},
);

// ---------------------------------------------------------------- page 14
const p14 = page(
  [
    txt('<p>RYE BROOK PARKS &amp; RECREATION<br>Fall 2025<br>REGISTRATION FORM</p>', {
      full: true, typo: { size: 16, weight: 700, align: 'center', color: '@cyan', spaceAfter: 4 },
    }),
    txt('<p>You can register and pay by Credit Card or E-Check online,</p><p>at  https://register.communitypass.net/reg/login.cfm?cuBMBPnClZwtomy3Erh3n%2B7frhNPXoxk9V2eh8RZkO%2BWj9UZiY3p8g%3D%3D</p><p>In person, or mail a check with this form to the Village of Rye Brook, Recreation Office, 938 King Street, RBNY 10573</p>', { full: true, typo: { size: 12.5 } }),
    {
      id: newId(), span: 'full', col: 0, background: { kind: 'none' }, typo: { size: 12.5 }, padding: 0,
      type: 'formFields',
      props: {
        lineColor: '@black',
        signatureLabel: 'Parent/Guardian Signature',
        rows: [
          { cells: [{ label: 'Name:', flex: 5 }, { label: 'Sex: M', flex: 0.9 }, { label: 'F', flex: 0.9 }] },
          { cells: [{ label: 'Address:', flex: 3 }, { label: 'City:', flex: 1.6 }, { label: 'State:', flex: 0.8 }, { label: 'Zip:', flex: 0.9 }] },
          { cells: [{ label: 'Home Tele. #: (____)', flex: 2 }, { label: 'Business Tele. #: (____)', flex: 2 }] },
          { cells: [{ label: 'Emergency contact person:', flex: 1 }] },
          { cells: [{ label: 'Telephone #: (____)', flex: 1.4 }, { label: 'E-Mail:', flex: 2.4 }] },
          { cells: [{ label: 'School:', flex: 2.6 }, { label: 'Grade:', flex: 0.8 }, { label: 'D.O.B.', flex: 1.6 }] },
          { cells: [{ label: 'Any Concerns/Requests:', flex: 1 }] },
          { cells: [{ label: 'Program:', flex: 3.2 }, { label: 'Fee:', flex: 1.5 }] },
          { cells: [{ label: 'Program:', flex: 3.2 }, { label: 'Fee:', flex: 1.5 }] },
          { cells: [{ label: 'Program:', flex: 3.2 }, { label: 'Fee:', flex: 1.5 }] },
          { cells: [{ label: 'Please makes checks payable to Rye Brook Recreation      Total Fee :', flex: 1.4 }] },
        ],
      },
    },
    txt('<p>I hereby authorize myself or child/children whose name/s appears above to participate in the above program, sponsored by the Rye Brook Parks and Recreation Department. I hereby release the Village of Rye Brook, their servants, employees and volunteers from any liability for personal injuries or property damage sustained by my child/children in connection with such participation.  In case of injury, I authorize the Recreation staff members to take my child to the hospital for treatment.</p>', { full: true, typo: { size: 12.5, align: 'justify' } }),
    photo(IMG.fallPond, { width: 'full', height: 2.75 }),
  ],
  { margin: 0.85, columns: 1, frame: null },
);

// ----------------------------------------------------------------------------

export function fall2025(): Doc {
  return {
    version: 1,
    title: 'Fall 2025 Activities Brochure',
    theme: { ...DEFAULT_THEME, palette: { ...DEFAULT_THEME.palette } },
    pageSetup: { size: 'letter', margin: 0.58, columns: 2, gutter: 0.12, numberFrom: 1 },
    pages: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14],
  };
}
