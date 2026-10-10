// /courses/<slug>.md: the Markdown twin of each course page, with the course in full.
import type { APIRoute, GetStaticPaths } from 'astro';
import { courses, coursePageHref, type Course } from '../../data/courses';
import { courseMarkdown, textResponse } from '../../lib/markdown';

export const getStaticPaths: GetStaticPaths = () =>
  courses.map((course) => ({ params: { slug: course.slug }, props: { course } }));

export const GET: APIRoute<{ course: Course }> = ({ props }) =>
  textResponse(courseMarkdown(props.course), 'text/markdown', coursePageHref(props.course.slug));
